export type Schema<T> = {
    [P in keyof T]: {(val: Partial<T[P]>): T[P]}
}

export type SchemaFunc<T extends {}> = (val: Partial<T>) => T;

export type SchemaType<S> = S extends SchemaFunc<infer T> ? T : never;

const schemaPropertiesMap = new Map<Schema<any>, string[]>();

function DateStringFunc(val: string) {
    var ticks = Date.parse(val);
    if(!isNaN(ticks))
        return (new Date(ticks)).toISOString();

    return "";
}

function AssertType<T>(val: T, typeFunc: {(val: T): T}, defaultValue: T) {
    switch(val) {
        case undefined:
            return defaultValue;
        case null:
            return val;
        default:
            return typeFunc(val);
    }
    /* val = typeFunc(val);
    return val; */
}

function AssertSchema<T>(val: Partial<T>, schema: Schema<T>) {
    if(val === null)
        return val;
    
    val = val || {};

    var ret = {} as T;
    var properties = (schemaPropertiesMap.get(schema) || Reflect.ownKeys(schema)) as Array<keyof T>;
    for(var x=0; x<properties.length; x++)
        ret[properties[x]] = schema[properties[x]]((val as any)[properties[x]]);

    /* var ret: Partial<T> = {};
    for(var key in val)
        if(schema[key])
            ret[key] = schema[key]((val as any)[key]); */
        
    return ret as T;
}

export function Upper(func: {(val: string): string}) {
    return (val: string) => {
        val = func(val);
        val = val && val.toUpperCase();
        return val;
    };
}

export function Max<T extends string | number>(max: number, func: {(val: T): T}) {
    return (val: T) => {
        val = func(val);
        if(typeof val === 'string' && val.length > max)
            return val.slice(0, max) as T;
        else if(typeof val === 'number' && val > max)
            return max as T;

        return val;
    };
}

export function Limit<T>(max: number, func: {(val: Array<T>): Array<T>}) {
    return (val: Array<T>) => {
        val = func(val);
        if(val.length > max)
            return val.slice(0, max);

        return val;
    };
}

export function Inherit<T1, T2>(schema1: Schema<T1>, schema2: Schema<T2>): Schema<T1> & Schema<T2> {
    var newSchema = {} as any;
    
    for(let key in schema1)
        newSchema[key] = schema1[key];

    for(let key2 in schema2)
        newSchema[key2] = (schema2 as any)[key2];

    return newSchema;
}

const ArrayType = Array;
const NumberType = Number;
const StringType = String;
const BooleanType = Boolean;
export namespace Schema {
    export const String = (val: string) => AssertType<string>(val, StringType, "");
    export const Number = (val: number) => AssertType<number>(val, NumberType, 0);
    export const Boolean = (val: boolean) => AssertType<boolean>(val, BooleanType, false);
    export const DateString = (val: string) => AssertType<string>(val, DateStringFunc, (new Date()).toISOString());

    export function Array<T>(func: {(val: Partial<T>): T}) {
        return (val: T[]) => {
            if(!ArrayType.isArray(val))
                return [];
            
            return val.map(func);
        }
    }

    /* export function Dictionary<T>(func: {(val: T): T}) {
        return (val: {[key: string]: T}) => {
            var ret = {} as {[key: string]: T};
            if(!val || typeof val !== "object" || ArrayType.isArray(val))
                return ret;
            
            for(var key in val)
                ret[key] = func(val[key]);

            return ret;
        }
    } */

    export function ToFunction<T>(schema: Schema<T>): SchemaFunc<T> {
        if(!schemaPropertiesMap.has(schema))
            schemaPropertiesMap.set(schema, Reflect.ownKeys(schema) as string[]);
        
        return (val: Partial<T>) => AssertSchema(val, schema);
    }

    /* export function GetSchema<T>(type: { new(): T }): SchemaFunc<T> {
        if(!schemaMap.has(type))
            throw new Error("No schema found for type: " + type.name);
        
        return schemaMap.get(type) as SchemaFunc<T>;
    }

    export function GetName(type: { new(): any }) {
        if(schemaMap.has(type))
            return type.name;

        throw new Error("Type " + type.name + " is not registered");
    }

    export function GetType(name: string) {
        return schemaNameMap.get(name);
    } */
}