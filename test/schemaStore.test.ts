import { Schema, SchemaType } from "../src/Schema/schema";
import { SchemaStore } from "../src/Store/schemaStore";

const sampleRecordSchema = {
    _id: Schema.String,
    name: Schema.String,
    sort: Schema.Number
}

const SampleRecordSchema = Schema.ToFunction(sampleRecordSchema);
type SampleRecord = SchemaType<typeof SampleRecordSchema>;

test('Create Schema Store', async () => {
    var store = new SchemaStore(SampleRecordSchema, "./test/DATA/createSchemaStore.dat");
    await store.Clear();
    expect(store.Has("first")).toBeFalsy();
    var first = { _id: "first", name: "name value", sort: 5 };
    store.Set(first);
    expect(store.Has("first")).toBeTruthy();
    first.name = "changed value";
    var firstCopy = await store.Get("first");
    expect((firstCopy as SampleRecord).name).toBe("name value");
    await store.Close();
});

test('Sort Schema Store', async () => {
    var store = new SchemaStore(SampleRecordSchema, "./test/DATA/sortSchemaStore.dat");
    await store.Clear();
    expect(store.Has("first")).toBeFalsy();
    await store.Set({ _id: "first", name: "name value", sort: 5 });
    await store.Set({ _id: "second", name: "name value", sort: 4 });
    await store.Set({ _id: "third", name: "name value", sort: 3 });
    await store.Delete("second");
    var results = await store.Query({ eq: { name: "name value" }, sort: { sort: "ASC" } });
    await store.Close();

    expect(results.length).toBe(2);
    expect(results[0].sort).toBe(3);
    expect(results[1].sort).toBe(5);
});

