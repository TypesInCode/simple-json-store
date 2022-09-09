export interface IRecord {
    _id: string;
}
export declare type RecordRow<T extends IRecord> = [string, "delete"] | [string, "set", T];
