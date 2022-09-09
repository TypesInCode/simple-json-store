import fs from "fs";
import { JsonStore } from "../src/Store/jsonStore";
import { IRecord } from "../src/Store/record";

interface SampleRecord extends IRecord {
    name: string;
    prop: string;
}

test('Create Store', async () => {
    var store = new JsonStore<SampleRecord>("./test/DATA/createStore.dat");
    await store.Clear();
    expect(store.Has("first")).toBeFalsy();
    store.Set({ _id: "first", name: "name value", prop: "prop value" });
    expect(store.Has("first")).toBeTruthy();
    await store.Close();
});

test('Store Updating Value', async () => {
    var store = new JsonStore<SampleRecord>("./test/DATA/updateValueStore.dat");
    await store.Clear();
    store.Set({ _id: "first", name: "name value", prop: "prop value" });
    store.Set({ _id: "first", name: "changed name", prop: "prop changed" });
    var val = await store.Get("first");
    expect(val?.name).toBe("changed name");
    await store.Close();

    store = new JsonStore<SampleRecord>("./test/DATA/updateValueStore.dat");
    await store.Pending;
    val = await store.Get("first");
    expect(val?.name).toBe("changed name");
    await store.Close();
});

test('Store Delete', async () => {
    var store = new JsonStore<SampleRecord>("./test/DATA/storeDelete.dat");
    await store.Clear();
    store.Set({ _id: "first", name: "name value", prop: "prop value" });
    expect(store.Has("first")).toBeTruthy();
    store.Delete("first");
    expect(store.Has("first")).toBeFalsy();
    await store.Close();

    store = new JsonStore<SampleRecord>("./test/DATA/storeDelete.dat");
    await store.Pending;
    expect(store.Has("first")).toBeFalsy();
    await store.Close();
});

test('Compress Store', async () => {
    var store = new JsonStore<SampleRecord>("./test/DATA/compressStore.dat");
    await store.Clear();
    store.Set({ _id: "first", name: "name value", prop: "prop value" });
    store.Set({ _id: "first", name: "changed name", prop: "prop changed" });
    var val = await store.Get("first");
    expect(val?.name).toBe("changed name");
    await store.Pending;
    var preStat = fs.statSync("./test/DATA/compressStore.dat");

    await store.Compress();
    var postStat = fs.statSync("./test/DATA/compressStore.dat");
    
    expect(preStat.size).toBeGreaterThan(postStat.size);
    await store.Close();

    store = new JsonStore<SampleRecord>("./test/DATA/updateValueStore.dat");
    await store.Pending;
    val = await store.Get("first");
    expect(val?.name).toBe("changed name");
    await store.Close();
});

test('Write During Compress Store', async () => {
    var store = new JsonStore<SampleRecord>("./test/DATA/writeDuringCompressStore.dat");
    await store.Clear();
    store.Set({ _id: "first", name: "name value", prop: "prop value" });
    store.Compress();
    store.Set({ _id: "first", name: "changed name", prop: "prop changed" });
    await store.Close();

    store = new JsonStore<SampleRecord>("./test/DATA/writeDuringCompressStore.dat");
    await store.Pending;
    var val = await store.Get("first");
    expect(val?.name).toBe("changed name");
    await store.Close();
});

test('Query Store', async () => {
    var store = new JsonStore<SampleRecord>("./test/DATA/queryStore.dat");
    await store.Clear();
    store.Set({ _id: "first", name: "name value", prop: "prop value" });
    store.Set({ _id: "second", name: "second value", prop: "prop value" });
    var values = await store.Query({ eq: { name: "second value" } });
    await store.Close();
    expect(values.length).toBe(1);

    store = new JsonStore<SampleRecord>("./test/DATA/queryStore.dat");
    values = await store.Query({ eq: { name: "name value" } });
    expect(values.length).toBe(1);
    await store.Close();

    expect(values.length).toBe(1);
    expect(values[0]._id).toBe("first");
});

test('Concurrent Queries', async () => {
    var store = new JsonStore<SampleRecord>("./test/DATA/concurrentQueries.dat");
    store.Set({ _id: "first", name: "name value", prop: "prop value" });
    store.Set({ _id: "second", name: "second value", prop: "prop value" });
    var results = await Promise.all([store.Query({ eq: { name: "second value" } }), store.Query({ eq: {name: "name value" } })]);
    expect(results[0][0]._id).toBe("second");
    expect(results[1][0]._id).toBe("first");
});

test('Many Reads and Writes', async () => {
    var randomValues = [
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random()
    ];

    var store = new JsonStore<{ _id: string, value: number }>("./test/DATA/manyReadsandWrites.dat");
    await store.Clear();
    for(var x=0; x<randomValues.length; x++)
        await store.Set({ _id: x.toString(), value: randomValues[x] });

    for(var x=0; x<1000; x++) {
        var index = Math.floor(Math.random() * randomValues.length);
        randomValues[index] = Math.random();
        if(Math.random() > .5)
            store.Set({ _id: index.toString(), value: randomValues[index] });
        else {
            store.Delete(index.toString());
            randomValues[index] = -1;
        }
    }

    for(var x=0; x<randomValues.length; x++) {
        var storeVal = await store.Get(x.toString());
        if(randomValues[x] > -1)
            expect(storeVal?.value).toBe(randomValues[x]);
        else
            expect(storeVal).toBeFalsy();
    }

    await store.Pending;

    console.log(randomValues);

    for(var x=0; x<randomValues.length; x++) {
        var storeVal = await store.Get(x.toString());
        if(randomValues[x] > -1)
            expect(storeVal?.value).toBe(randomValues[x]);
        else
            expect(storeVal).toBeFalsy();
    }

    await store.Compress();

    for(var x=0; x<randomValues.length; x++) {
        var storeVal = await store.Get(x.toString());
        if(randomValues[x] > -1)
            expect(storeVal?.value).toBe(randomValues[x]);
        else
            expect(storeVal).toBeFalsy();
    }
});

test('Performance of Query Over Large File', async () => {
    var s = Date.now();
    var store = new JsonStore<{ _id: string, value: number, value2: string }>("./test/DATA/performanceOfQueryOverLargeFile.dat", { value: true, value2: true });
    await store.Clear();

    const records = 100000;
    var expectedValue = 0;
    var expectedResultCount = 0;
    for(var x=0; x<records; x++) {
        let value = Math.floor(Math.random() * 100) + 1;
        expectedValue = expectedValue || value;
        if(value === expectedValue)
            expectedResultCount++;

        if(x % 1000 === 0)
            await store.Set({ _id: x.toString(), value: value, value2: Math.random().toString() });
        else
            store.Set({ _id: x.toString(), value: value, value2: Math.random().toString() });
    }

    await store.Pending;
    expect(store.Size).toBe(records);
    var e = Date.now();
    console.log(`Store initialization took ${e - s}ms`);

    var totalQueryTime = 0;
    var s = Date.now();
    var results = await store.Query({ eq: { value: expectedValue } });
    var e = Date.now();
    expect(results.length).toBe(expectedResultCount);
    console.log(`eq query for ${expectedResultCount} records across ${records} total took ${e - s}ms`);
    totalQueryTime += e - s;

    /* s = Date.now();
    var getResults: any[] = [];
    for(var x=0; x<results.length; x++)
        getResults.push(await store.Get(results[x]._id));
    e = Date.now();
    expect(getResults.length).toBe(expectedResultCount);
    console.log(`Serial Get calls for ${expectedResultCount} records across ${records} total took ${e - s}ms`); */

    s = Date.now();
    var getResults = await Promise.all(results.map(r => store.Get(r._id)));
    e = Date.now();
    expect(getResults.length).toBe(expectedResultCount);
    console.log(`Concurrents Get calls for ${expectedResultCount} records across ${records} total took ${e - s}ms`);    

    s = Date.now();
    getResults = await store.GetAll(results.map(r => r._id));
    e = Date.now();
    expect(getResults.length).toBe(expectedResultCount);
    console.log(`GetAll for ${expectedResultCount} records across ${records} total took ${e - s}ms`);

    var s = Date.now();
    var twoResults = await Promise.all([store.Query({ eq: { value: expectedValue } }), store.Query({ eq: { value: expectedValue }, take: 500 })]);
    var e = Date.now();
    expect(twoResults[0].length).toBe(expectedResultCount);
    expect(twoResults[1].length).toBe(500);
    console.log(`2 Concurrent eq queries for ${expectedResultCount} and ${500} records across ${records} total took ${e - s}ms`);
    totalQueryTime += e - s;

    s = Date.now();
    results = await store.Query({ eq: { value: expectedValue }, sort: { value2: "DESC" } });
    e = Date.now();
    expect(results.length).toBe(expectedResultCount);
    console.log(`eq/sort query for ${expectedResultCount} records across ${records} total took ${e - s}ms`);
    totalQueryTime += e - s;

    s = Date.now();
    results = await store.Query({ eq: { value: expectedValue }, sort: { value2: "ASC" }, skip: Math.floor(expectedResultCount / 2) });
    e = Date.now();
    expect(results.length).toBe(expectedResultCount - Math.floor(expectedResultCount / 2));
    console.log(`eq/sort/skip query for ${expectedResultCount - Math.floor(expectedResultCount / 2)} records across ${records} total took ${e - s}ms`);
    totalQueryTime += e - s;

    s = Date.now();
    results = await store.Query({ eq: { value: expectedValue }, sort: { value2: "ASC" }, skip: Math.floor(expectedResultCount / 3), take: 10 });
    e = Date.now();
    expect(results.length).toBe(10);
    console.log(`eq/sort/skip/take query for ${10} records across ${records} total took ${e - s}ms`);
    totalQueryTime += e - s;
    // console.log(results);

    var s = Date.now();
    var results = await store.Query({ take: 10, sort: { _id: 'DESC' } });
    var e = Date.now();
    expect(results.length).toBe(10);
    console.log(`Take/sort query for ${10} records across ${records} total took ${e - s}ms`);
    totalQueryTime += e - s;
    // console.log(results);

    s = Date.now();
    const gteVal =  Math.floor(Math.random() * 100) + 1;
    results = await store.Query({ gte: { value: gteVal } });
    e = Date.now();
    console.log(`gte query for ${gteVal} resulted in ${results.length} records and took ${e - s}ms`);
    totalQueryTime += e - s;

    var s = Date.now();
    var allResults = await Promise.all([
        store.Query({ eq: { value: expectedValue } }),
        Promise.all([store.Query({ eq: { value: expectedValue } }), store.Query({ eq: { value: expectedValue }, take: 1000 })]),
        store.Query({ eq: { value: expectedValue }, sort: { value2: "DESC" } }),
        store.Query({ eq: { value: expectedValue }, sort: { value2: "ASC" }, skip: Math.floor(expectedResultCount / 2) }),
        store.Query({ eq: { value: expectedValue }, sort: { value2: "ASC" }, skip: Math.floor(expectedResultCount / 3), take: 10 }),
        store.Query({ take: 10, sort: { _id: 'DESC' } }),
        store.Query({ gte: { value: gteVal } })
    ]);
    var e = Date.now();
    expect(allResults[5].length).toBe(10);
    console.log(`All prior queries concurrently took ${e - s}ms compared to ${totalQueryTime}ms separately (${(((e-s)/totalQueryTime) * 100).toFixed(2)}%)`);
}, 25000);

