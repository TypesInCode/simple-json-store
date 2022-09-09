import { RecordWriter } from "../src/File/recordWriter";
import { IRecord } from "../src/Store/record";
import { JsonStore } from "../src/Store/jsonStore";
import { ZlibJsonStore } from "../src/Store/zlibJsonStore";

interface SampleRecord extends IRecord {
    name: string;
    prop: string;
    third?: string;
    fourth?: string;
    fifth?: string;
}

/* const sampleRecordSchema = Inherit<IRecord, SampleRecord>(recordSchema, {
    name: Schema.String,
    prop: Schema.String
});

const SampleRecordSchema = Schema.ToFunction(sampleRecordSchema); */

function GenerateString(length: number) {
    var ret = "";
    for(var x=0; x<length; x++)
        ret += Math.floor(Math.random() * 10).toString();

    return ret;
}

function CreateSampleRecord(): SampleRecord {
    return {
        _id: GenerateString(5),
        name: `${GenerateString(5)} ${GenerateString(8)}`,
        prop: GenerateString(10),
        third: GenerateString(10),
        fourth: GenerateString(10),
        fifth: GenerateString(10)
    };
}

test('Create Store', async () => {
    var store = new ZlibJsonStore<SampleRecord>("./test/DATA/createZlibStore.dat");
    await store.Clear();
    expect(store.Has("first")).toBeFalsy();
    store.Set({ _id: "first", name: "name value", prop: "prop value" });
    expect(store.Has("first")).toBeTruthy();
    await store.Close();

    store = new ZlibJsonStore<SampleRecord>("./test/DATA/createZlibStore.dat");
    await store.Pending;
    expect(store.Has("first")).toBeTruthy();
    await store.Close();
});

test('A Lot of Data', async () => {
    var data: SampleRecord[] = [];
    for(var x=0; x<10000; x++)
        data.push(CreateSampleRecord());
    
    var s1 = Date.now();
    var zLibStore = new ZlibJsonStore<SampleRecord>("./test/DATA/zlibALotOfData.dat");
    await zLibStore.Clear();
    for(var x=0; x<data.length; x++)
        zLibStore.Set(data[x]);
    await zLibStore.Close();
    var e1 = Date.now();
    // console.log(`Wrote ${data.length} zlib records in ${e1 - s1}ms`);

    var s2 = Date.now();
    var jsonStore = new JsonStore<SampleRecord>("./test/DATA/zlibALotOfDataJson.dat");
    await jsonStore.Clear();
    for(var x=0; x<data.length; x++)
        jsonStore.Set(data[x]);
    await jsonStore.Close();
    var e2 = Date.now();
    // console.log(`Wrote ${data.length} json records in ${e2 - s2}ms`);

    var s3 = Date.now();
    var zLibReadStore = new ZlibJsonStore<SampleRecord>("./test/DATA/zlibALotOfData.dat");
    await zLibReadStore.Pending;
    await zLibReadStore.Close();
    var e3 = Date.now();
    // console.log(`Read ${data.length} zlib records in ${e3 - s3}ms`);
    var randomRecord = data[Math.floor(Math.random() * data.length)];
    expect(zLibReadStore.Has(randomRecord._id)).toBeTruthy();


    var s4 = Date.now();
    var jsonReadStore = new JsonStore<SampleRecord>("./test/DATA/zlibALotOfDataJson.dat");
    await jsonReadStore.Pending;
    await jsonReadStore.Close();
    var e4 = Date.now();
    // console.log(`Read ${data.length} json records in ${e4 - s4}ms`);
    expect(jsonReadStore.Has(randomRecord._id)).toBeTruthy();
}, 10000);

