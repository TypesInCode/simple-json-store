import { IRecord } from "./record";
export declare type RecursivePartial<T> = {
    [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P];
};
export declare class JsonIndex<T extends IRecord> {
    private data;
    private indexMap;
    get Indexed(): Set<string>;
    get Values(): IterableIterator<T>;
    constructor();
    Set(object: T): void;
    Has(id: string): boolean;
    Get(id: string): T | undefined;
    Delete(id: string): boolean;
    Clear(): void;
    Query(query: RecursivePartial<T>): T[];
    private GetQueryProperties;
    private AddToIndex;
    private GetValue;
    private GetIdSet;
    private EnsureIndex;
    private RebuildIndex;
}
