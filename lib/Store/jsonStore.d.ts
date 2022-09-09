/// <reference types="node" />
import { IRecord, RecordRow } from "./record";
import { JsonIndex, RecursivePartial } from "./jsonIndex";
export declare class JsonStore<T extends IRecord> {
    private filePath;
    private compressing;
    private adapter;
    protected index: JsonIndex<T>;
    get Pending(): Promise<any[]>;
    constructor(filePath: string);
    Has(id: string): boolean;
    Set(value: T): void;
    Get(id: string): T | undefined;
    Query(query: RecursivePartial<T>): T[];
    Delete(id: string): boolean;
    Clear(): Promise<void>;
    Compress(): Promise<void>;
    Close(): Promise<void>;
    protected SetCache(value: T): void;
    protected DeleteCache(id: string): boolean;
    protected ToBuffer(record: RecordRow<T>): Promise<Buffer>;
    protected FromBuffer(buffer: Buffer): Promise<RecordRow<T> | null>;
    private ToRecord;
    private Write;
    private InitStore;
    private ClearStore;
    private CompressStore;
}
