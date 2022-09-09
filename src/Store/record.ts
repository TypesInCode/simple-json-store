export interface IRecord {
    _id: string;
};

export type RecordRow<T extends IRecord> = [string, "delete"] | [string, "set", T];