/// <reference types="node" />
export declare class RecordWriter {
    private filePath;
    private initPromise;
    private writeStream;
    private currentOffset;
    constructor(filePath: string);
    Clear(): Promise<void>;
    Write(buffer: Buffer): Promise<number>;
    Close(): Promise<void>;
    private Init;
}
