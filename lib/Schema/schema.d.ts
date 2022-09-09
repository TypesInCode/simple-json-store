export declare type Schema<T> = {
    [P in keyof T]: {
        (val: T[P]): T[P];
    };
};
export declare type SchemaFunc<T> = (val: Partial<T>) => T;
export declare function Upper(func: {
    (val: string): string;
}): (val: string) => string;
export declare function Max<T extends string | number>(max: number, func: {
    (val: T): T;
}): (val: T) => T;
export declare function Limit<T>(max: number, func: {
    (val: Array<T>): Array<T>;
}): (val: Array<T>) => T[];
export declare function Inherit<T1, T2 extends T1>(schema1: Schema<T1>, schema2: Schema<Omit<T2, keyof T1>>): Schema<T1> & Schema<T2>;
export declare namespace Schema {
    const String: (val: string) => string;
    const Number: (val: number) => number;
    const Boolean: (val: boolean) => boolean;
    const DateString: (val: string) => string;
    function Array<T>(func: {
        (val: Partial<T>): T;
    }): (val: T[]) => T[];
    function Dictionary<T>(func: {
        (val: T): T;
    }): (val: {
        [key: string]: T;
    }) => {
        [key: string]: T;
    };
    function ToFunction<T>(schema: Schema<T>): SchemaFunc<T>;
}
