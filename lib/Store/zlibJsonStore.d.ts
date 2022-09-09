/// <reference types="node" />
import { IRecord, RecordRow } from "./record";
import { JsonStore } from "./jsonStore";
export declare class ZlibJsonStore<T extends IRecord> extends JsonStore<T> {
    protected ToBuffer(record: RecordRow<T>): Promise<Buffer>;
    protected FromBuffer(buffer: Buffer): Promise<[string, "delete"] | [string, "set", T] | null>;
}
