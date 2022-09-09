/// <reference types="node" />
export declare class RecordReader {
    private readStream;
    private readIndex;
    private records;
    private partialRecord;
    private recordRemaining;
    private readComplete;
    private fileError;
    get FileError(): any;
    constructor(filePath: string, offset?: number);
    ReadAll(): AsyncGenerator<Buffer, void, unknown>;
    Read(): Promise<Buffer | null>;
    Close(): Promise<void>;
    private ReadData;
    private ReadPartialData;
}
