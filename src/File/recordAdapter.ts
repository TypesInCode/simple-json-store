import { Concurrency, Multiple, Single } from "../Decorators/concurrency";
import { RecordReader, OffsetBuffer } from "./recordReader";
import { RecordWriter } from "./recordWriter";

@Concurrency
export class RecordAdapter {

    // private recordReader = new RecordReader(this.filePath);
    private recordWriter: RecordWriter | null = null;

    public get Pending() {
        return Promise.all(Concurrency.Awaiting(this));
    }

    constructor(private filePath: string) { }

    @Multiple()
    public async Read(offset = 0): Promise<OffsetBuffer | null> {
        await this.EndWrite();

        var reader = new RecordReader(this.filePath, [offset]);
        var buffer = await reader.Read();
        reader.Close();
        return buffer;
    }

    @Multiple("Read")
    public async ReadAll(callback: {(record: OffsetBuffer): Promise<void>}, offsets?: number[]) {
        await this.EndWrite()

        var reader = new RecordReader(this.filePath, offsets); // , offsets);
        var offsetBuffer: OffsetBuffer | null = null;
        while(offsetBuffer = await reader.Read())
            await callback(offsetBuffer);

        // await callback(reader.ReadAll());
        reader.Close();
    }

    @Multiple()
    public async Write(buffer: Promise<Buffer> | Buffer) {
        this.recordWriter = this.recordWriter || new RecordWriter(this.filePath);
        return await this.recordWriter.Write(await buffer);
    }

    @Single
    public async Clear() {
        this.recordWriter = this.recordWriter || new RecordWriter(this.filePath);
        await this.recordWriter.Clear();
    }

    @Single
    public async Close() {        
        await this.EndWrite();
    }

    @Single
    public async Pause(callback: {(): Promise<void>}) {
        await this.EndWrite();
        await callback();
    }

    private async EndWrite() {
        if(this.recordWriter === null)
            return;
            
        var writer = this.recordWriter;
        this.recordWriter = null;
        await writer?.Close()
    }

}