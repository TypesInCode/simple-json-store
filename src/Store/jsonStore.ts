import { RecordWriter } from "../File/recordWriter";
import { IRecord, RecordRow } from "./record";
import fs from "fs";
import { RecordAdapter } from "../File/recordAdapter";
import { JsonIndex, JsonIndexQuery, RecursiveIndex } from "./jsonIndex";
import { OffsetBuffer, RecordReader } from "../File/recordReader";

export class JsonStore<T extends IRecord> {
    private adapter: RecordAdapter;
    private objectCache: Map<string, T> = new Map();
    private objectCacheVersion: Map<string, number> = new Map();
    private offsetCache: Map<string, number> = new Map();
    private index: JsonIndex<T>;

    public get Pending() {
        return this.adapter.Pending;
    }

    public get Size() {
        return this.index.Size;
    }

    constructor(private filePath: string, index?: RecursiveIndex<T>) {
        this.adapter = new RecordAdapter(filePath);
        this.index = new JsonIndex(() => this.InitStore(), index);
    }

    public Has(id: string) {
        return this.index.Has(id);
    }

    private getIds: string[] = [];
    private getResult: Promise<Map<string, T>> | null = null;
    public async Get(id: string) {
        this.getIds.push(id);
        if(this.getResult === null)
            this.getResult = new Promise((resolve, reject) => {
                setTimeout(() => {
                    const getIds = this.getIds;
                    this.getIds = [];
                    this.getResult = null;
    
                    this.GetAll(getIds).then(results => {
                        resolve(new Map(results.filter(r => r !== undefined).map(r => [r._id, r])));
                    }, reject);
                }, 5);
            });

        var resultMap = await this.getResult;
        return resultMap.get(id);

        /* if(this.objectCache.has(id))
            return this.objectCache.get(id) as T;

        var offset = this.offsetCache.get(id);
        if(offset !== undefined) {
            var buffer = await this.adapter.Read(offset);
            if(buffer !== null) {
                var record = await this.FromBuffer(buffer.buffer);
                if(record !== null && record[1] === "set")
                    return record[2];
            }
        }

        return null; */
    }

    public async GetAll(ids: string[]) {
        var resultMap = new Map<string, T | undefined>(ids.map(id => [id, this.objectCache.get(id)]));
        // var offsets = ids.filter(id => resultMap.get(id) === undefined).map(id => this.offsetCache.get(id)).filter(offset => offset !== undefined) as number[];
        var offsets = ids.map(id => this.objectCache.has(id) ? undefined : this.offsetCache.get(id)).filter(offset => offset !== undefined) as number[];

        if(offsets.length > 0)
            await this.adapter.ReadAll(async buffer => {
                var record = await this.FromBuffer(buffer.buffer);
                if(record !== null && record[1] === "set")
                    resultMap.set(record[0], record[2]);
            }, offsets);
        
        /* for(var x=0; this.objectCache.size > 0 && x<ids.length; x++) {
            var obj = this.objectCache.get(ids[x]);
            if(obj !== undefined)
                resultMap.set(obj._id, obj);
        } */
        
        return [...resultMap.values()] as T[];
    }

    public async Set(value: T) {
        var version = this.objectCacheVersion.get(value._id) || 0;
        version++;
        this.objectCacheVersion.set(value._id, version);
        this.objectCache.set(value._id, value);
        this.index.Set(value);
        
        var record = this.ToRecord(value._id, "set", value);
        await this.Write(record).then(offset => {
            if(this.objectCache.has(value._id) && this.objectCacheVersion.get(value._id) === version) {
                this.objectCache.delete(value._id);
                this.objectCacheVersion.delete(value._id);
                this.offsetCache.set(value._id, offset);
            }
        });
    }

    public async Query(query: JsonIndexQuery<T>): Promise<T[]> {
        var ids = await this.index.Query(query);
        return this.GetAll(ids);

        /* var resultMap = new Map<string, T | undefined>(ids.map(id => [id, this.objectCache.get(id)]));
        var offsets = ids.filter(id => resultMap.get(id) === undefined).map(id => this.offsetCache.get(id)).filter(offset => offset !== undefined) as number[];

        if(offsets.length > 0)
            await this.adapter.ReadAll(async buffer => {
                var record = await this.FromBuffer(buffer.buffer);
                if(record !== null && record[1] === "set")
                    resultMap.set(record[0], record[2]);
            }, offsets); */
        
        /* for(var x=0; this.objectCache.size > 0 && x<ids.length; x++) {
            var obj = this.objectCache.get(ids[x]);
            if(obj !== undefined)
                resultMap.set(obj._id, obj);
        } */
        
        // return [...resultMap.values()].filter(obj => obj !== undefined) as T[];
    }

    public async Delete(id: string) {  
        var deleted = this.DeleteCache(id);

        if(deleted) {
            var record = this.ToRecord(id, "delete");
            await this.Write(record);
        }        

        return deleted;
    }

    public async Clear() {
        await this.ClearStore();
    }

    public async Compress() {
        await this.CompressStore();
    }

    public async Close() {
        await this.adapter.Close();
    }

    protected DeleteCache(id: string) {
        this.objectCache.delete(id);
        // this.objectCacheVersion.delete(id);
        this.offsetCache.delete(id);
        return this.index.Delete(id);
    }

    protected async ToBuffer(record: RecordRow<T>) {
        var jsonStr = JSON.stringify(record);
        return Buffer.from(jsonStr);
    }

    protected async FromBuffer(buffer: Buffer): Promise<RecordRow<T> | null> {
        var jsonStr = buffer.toString();
        try {
            return JSON.parse(jsonStr) as RecordRow<T>;
        } catch(err) {
            return null;
        }
    }

    private ToRecord(id: string, action: "delete"): RecordRow<T>;
    private ToRecord(id: string, action: "set", value: T): RecordRow<T>;
    private ToRecord(id: string, action: "set" | "delete", value?: T): RecordRow<T> {
        switch(action) {
            case "delete":
                return [id, "delete"];
            case "set":
                if(value !== undefined)
                    return [id, "set", value];
                break;
        }

        throw new Error("Argument exception");
    }

    private Write(record: RecordRow<T>) {
        return this.adapter.Write(this.ToBuffer(record));
    }

    private async InitStore() {
        await this.adapter.ReadAll(async offsetBuffer => {
                let record = await this.FromBuffer(offsetBuffer.buffer);
                if(record !== null)
                    switch(record[1]) {
                        case "set":
                            this.index.Set(record[2]);
                            this.offsetCache.set(record[2]._id, offsetBuffer.offset);
                            break;
                        case "delete":
                            this.DeleteCache(record[0]);
                            break;
                    }
        }, this.offsetCache.size > 0 ? [...this.offsetCache.values()] : undefined);
    }

    private async ClearStore() {        
        this.adapter.Clear();
        await this.adapter.Pause(async () => {
            this.objectCache.clear();
            this.offsetCache.clear();
            this.objectCacheVersion.clear();
            this.index.Clear();
        });      
    }

    private async CompressStore() {    
        await this.adapter.Pause(async () => {
            this.objectCacheVersion.clear();
            var compressedPath = `${this.filePath}.compressing`;
            try { await fs.promises.unlink(compressedPath) }
            catch(err) { }
            
            var reader = new RecordReader(this.filePath, [...this.offsetCache.values()]);
            var compressedWriter = new RecordWriter(compressedPath);
            
            var buffer: OffsetBuffer | null = null;
            while(buffer = await reader.Read()) {
                var record = await this.FromBuffer(buffer.buffer);
                if(record !== null && record[1] === "set") {
                    var offset = await compressedWriter.Write(buffer.buffer);
                    this.offsetCache.set(record[2]._id, offset);
                }
            }

            await compressedWriter.Close();
            await fs.promises.rename(this.filePath, `${this.filePath}.temp`);
            await fs.promises.rename(compressedPath, this.filePath);
            await fs.promises.unlink(`${this.filePath}.temp`);
        });
    }
}