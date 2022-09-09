import { SchemaFunc, SchemaType } from "../Schema/schema";
import { JsonIndexQuery } from "./jsonIndex";
import { JsonStore } from "./jsonStore";

export class SchemaStore<T extends SchemaFunc<any>> extends JsonStore<SchemaType<T>> {

    constructor(private schema: T, filePath: string) {
        super(filePath);
    }

    public async Get(id: string): Promise<SchemaType<T> | undefined> {
        var ret = await super.Get(id);
        return this.schema(ret as SchemaType<T>);
    }

    public async Set(value: SchemaType<T>) {
        var copy = this.schema(value);
        await super.Set(copy);
    }

    // public async Query(query: RecursivePartial<SchemaType<T>>, sort?: RecursiveSort<SchemaType<T>>): Promise<SchemaType<T>[]> {
    public async Query(query: JsonIndexQuery<SchemaType<T>>) {
        var ret = await super.Query(query);
        return ret.map<SchemaType<T>>(this.schema);
    }

}