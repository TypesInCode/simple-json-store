import { RecordReader } from "../src/File/recordReader";
import { RecordAdapter } from "../src/File/recordAdapter";

test('Create Adapter', async () => {
    var adapter = new RecordAdapter("./test/DATA/createAdapter.dat");
    adapter.Clear();
    adapter.Write(Buffer.from("test value"));
    var buffer = await adapter.Read();
    expect(buffer).toBeTruthy();
    expect(buffer?.buffer.toString()).toBe("test value");
    await adapter.Close();

    var reader = new RecordReader("./test/DATA/createAdapter.dat");
    buffer = await reader.Read();
    expect(buffer).toBeTruthy();
    var str = buffer?.buffer.toString();
    expect(str).toBe("test value");
    buffer = await reader.Read();

    expect(buffer).toBeFalsy();
    await reader.Close();
});

test('Write Then Concurrent Reads', async () => {
    var adapter = new RecordAdapter("./test/DATA/writeThenConcurrentReads.dat");

    adapter.Clear();
    adapter.Write(Buffer.from("test value"));

    var [buffer1, buffer2] = await Promise.all([adapter.Read(), adapter.Read()]);

    var str1 = buffer1?.buffer.toString();
    var str2 = buffer2?.buffer.toString();
    expect(str1).toBe("test value");
    expect(str1).toBe(str2);

    await adapter.Close();
});

test('Read All', async () => {
    var adapter = new RecordAdapter("./test/DATA/readAll.dat");
    adapter.Clear();
    var count = 0;
    await adapter.ReadAll(async () => {
        count++;
    });
    /* adapter.ReadAll(async generator => {
        for await(var buffer of generator)
            count++;
    }); */
    
    adapter.Write(Buffer.from("testing read all"));
    expect(count).toBe(0);

    await adapter.ReadAll(async buffer => {
        count++;
        expect(buffer.buffer.toString()).toBe("testing read all");
    });
    /* await adapter.ReadAll(async generator => {
        for await(var buffer of generator) {
            count++;
            expect(buffer?.buffer.toString()).toBe("testing read all");
        }
    }); */

    expect(count).toBe(1);
    await adapter.Close();
});