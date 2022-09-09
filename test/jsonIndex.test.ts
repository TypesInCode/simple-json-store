import { JsonIndex } from "../src/Store/jsonIndex";
import { IRecord } from "../src/Store/record";

interface SampleRecord extends IRecord {
    name: string;
    prop: string;
    child?: {
        first: string;
        second: string;
    }
}

const data: SampleRecord[] = [
    {
        _id: "first",
        name: "first name",
        prop: "prop value"
    },
    {
        _id: "second",
        name: "second name",
        prop: "o prop value",
        child: {
            first: "child first",
            second: "child second"
        }
    },
    {
        _id: "third",
        name: "aardvark",
        prop: "animal name"
    },
    {
        _id: "fourth",
        name: "bear",
        prop: "animal name"
    },
    {
        _id: "fifth",
        name: "first name",
        prop: "a new prop value"
    },
    {
        _id: "sixth",
        name: "sixth name",
        prop: "a ppprop value"
    }
]

async function BuildIndex(index: JsonIndex<SampleRecord>) {
    for(var x=0; x<data.length; x++)
        index.Set(data[x]);
}

test('Index', async () => {
    // var index = new JsonIndex<SampleRecord>(async (callback) => await callback(GetData()));
    var index = new JsonIndex<SampleRecord>(BuildIndex);
    // data.forEach(val => index.Set(val));
    var results = await index.Query({ eq: { name: "first name" } });
    expect(results.length).toBe(2);
    expect(results[0]).toBe("first");
});

test('Greater Than', async () => {
    var index = new JsonIndex<SampleRecord>(BuildIndex);
    // data.forEach(val => index.Set(val));
    var results = await index.Query({ gte: { name: "first name", prop: "b" } });
    expect(results.length).toBe(2);
    expect(results.some(r => r === "first")).toBeTruthy();
});

test('Greater Than w/ Sort', async () => {
    var index = new JsonIndex<SampleRecord>(BuildIndex);
    // data.forEach(val => index.Set(val));
    var results = await index.Query({ gte: { name: "first name", prop: "b" }, sort: { name: 'ASC' } });
    expect(results.length).toBe(2);
    expect(results[0]).toBe('first');
});

test('Great Than with Neq', async () => {
    var index = new JsonIndex<SampleRecord>(BuildIndex);
    // data.forEach(val => index.Set(val));
    var results = await index.Query({ gte: { name: "first name", prop: "b" }, neq: { name: 'first name' } });
    expect(results.length).toBe(1);
});

test('Less Than', async () => {
    var index = new JsonIndex<SampleRecord>(BuildIndex);
    var results = await index.Query({ lt: { name: "first name" } });
    expect(results.length).toBe(2);
});

/* test('Multiple Values', async () => {
    var index = new JsonIndex<SampleRecord>(BuildIndex);
    // data.forEach(val => index.Set(val));
    // expect(index.Indexed.size).toBe(0);
    var results = await index.Query({ filter: { prop: "prop value" } });
    // expect(index.Indexed.size).toBe(1);
    expect(results.length).toBe(2);
});

test('Multiple Properties', async () => {
    var index = new JsonIndex<SampleRecord>(BuildIndex, { name: true });
    // data.forEach(val => index.Set(val));
    // expect(index.Indexed.size).toBe(0);
    var results = await index.Query({ filter: { name: "second name", prop: "prop value" } });
    expect(index.Indexed.size).toBe(3);
    expect(results.length).toBe(1);
    expect(results[0]).toBe("second");
});

test('Add Value', async () => {
    var index = new JsonIndex<SampleRecord>(BuildIndex);
    // data.forEach(val => index.Set(val));
    var results = await index.Query({ filter: { name: "first name" } });
    expect(results.length).toBe(1);
    index.Set({ _id: "third", name: "first name", prop: "other value" });
    results = await index.Query({ filter: { name: "first name" } });
    expect(results.length).toBe(2);
});

test('Update Value', async () => {
    var index = new JsonIndex<SampleRecord>(BuildIndex);
    // data.forEach(val => index.Set(val));
    var results = await index.Query({ filter: { name: "first name" } });
    expect(results.length).toBe(1);
    index.Set({ _id: "first", name: "changed name", prop: "other value" });
    results = await index.Query({ filter: { name: "first name" } });
    expect(results.length).toBe(0);    
});

test('Child Query', async () => {
    var index = new JsonIndex<SampleRecord>(BuildIndex);
    // data.forEach(val => index.Set(val));
    var results = await index.Query({ filter: { child: { first: "child first" } } });
    expect(results.length).toBe(1);
    expect(results[0]).toBe("second");
});

test('Invalid Queries', async () => {
    var index = new JsonIndex<SampleRecord>(BuildIndex);
    // data.forEach(val => index.Set(val));
    var results = await index.Query({});
    expect(results.length).toBe(0);
}); 

test('Sorting Test 1', async () => {
    var index = new JsonIndex<SampleRecord>(BuildIndex);
    var results = await index.Query({ filter: { prop: "prop value" }, sort: { name: "DESC" } });
    expect(results[0]).toBe("second");
    expect(results[1]).toBe("first");

    results = await index.Query({ filter: { prop: "prop value" }, sort: { name: "ASC" } });
    expect(results[1]).toBe("second");
    expect(results[0]).toBe("first");
});
*/
