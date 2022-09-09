import { IRecord, RecordRow } from "./record";
import { JsonStore } from "./jsonStore";
import zlib from "zlib";

export class ZlibJsonStore<T extends IRecord> extends JsonStore<T> {

    protected async ToBuffer(record: RecordRow<T>) {
        var buffer = await super.ToBuffer(record);
        return new Promise<Buffer>(function(resolve, reject) { 
            zlib.deflateRaw(buffer, function(err, result) {
                if(err)
                    reject(err);
                else
                    resolve(result);
            });
        });
    }

    protected async FromBuffer(buffer: Buffer) {
        var inflated = await new Promise<Buffer>(function(resolve, reject) {
            zlib.inflateRaw(buffer, function(err, result) {
                if(err)
                    reject(err);
                else
                    resolve(result);
            });
        });

        return super.FromBuffer(inflated);
    }

}