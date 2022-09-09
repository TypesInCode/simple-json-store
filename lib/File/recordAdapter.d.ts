/// <reference types="node" />
import { RecordWriter } from "./recordWriter";
export declare class RecordAdapter {
    private filePath;
    private readPromises;
    private writePromise;
    private closePromise;
    private pausePromise;
    private recordWriter;
    get Pending(): Promise<any[]>;
    protected get CloseWrite(): Promise<[void, void, void]>;
    constructor(filePath: string);
    Read(offset?: number): Promise<Buffer | null>;
    ReadAll(callback: {
        (generator: AsyncGenerator<Buffer, void, void>): Promise<void>;
    }): Promise<void>;
    Write(callback: {
        (writer: RecordWriter): Promise<any>;
    }): Promise<void>;
    Close(): Promise<void>;
    Pause(callback: {
        (): Promise<void>;
    }): Promise<void>;
    private PauseAdapter;
    private CloseAdapter;
    private ReadCallback;
    private EndWrite;
    private WriteCallback;
}
