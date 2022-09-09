import { RecordReader, OffsetBuffer } from "../src/File/recordReader";
import { RecordWriter } from "../src/File/recordWriter";
import zlib from "zlib";

test('Read From Offset', async () => {
    var writer = new RecordWriter("./test/DATA/readFromOffset.dat");
    await writer.Clear();
    await writer.Write(Buffer.from("test value"));
    var offset = await writer.Write(Buffer.from("secondary value"));
    await writer.Close();

    var reader = new RecordReader("./test/DATA/readFromOffset.dat", [offset]);
    var buffer = await reader.Read();
    var buffer2 = await reader.Read();

    expect(buffer).toBeTruthy();
    expect(buffer?.buffer.toString()).toBe("secondary value");
    expect(buffer2).toBeFalsy();
});

test('Create Reader', async () => {
    var writer = new RecordWriter("./test/DATA/createReader.dat");
    await writer.Clear();
    await writer.Write(Buffer.from("test value"));
    await writer.Close();

    var reader = new RecordReader("./test/DATA/createReader.dat");
    var buffer = await reader.Read();
    expect(buffer).toBeTruthy();
    var str = buffer?.buffer.toString();
    expect(str).toBe("test value");
    await reader.Close();
});

test('Parrallel Reads', async () => {
    var writer = new RecordWriter("./test/DATA/parrallelReads.dat");
    await writer.Clear();
    await writer.Write(Buffer.from("test value"));
    await writer.Close();

    var reader1 = new RecordReader("./test/DATA/parrallelReads.dat");
    var reader2 = new RecordReader("./test/DATA/parrallelReads.dat");
    var p1 = reader1.Read();
    var p2 = reader2.Read();

    var buffers = (await Promise.all([p1, p2])).map(b => b?.buffer);
    expect(buffers[0]).toBeTruthy();
    expect(buffers[1]).toBeTruthy();
    await reader1.Close();
    await reader2.Close();
});

/* test('No Data File', async () => {
    var reader = new RecordReader("./test/DATA/doesNotExist.dat");
    expect(reader.Error).toBeTruthy();
    var buffer = await reader.Read();
    expect(buffer).toBeFalsy();
}); */

/* test('Three Reads', async () => {
    var writer = new RecordWriter("./test/DATA/threeReads.dat");
    await writer.Clear();
    writer.Write(Buffer.from("test value"));
    writer.Write(Buffer.from("second value"));
    writer.Write(Buffer.from("third value"));
    await writer.Close();

    var reader = new RecordReader("./test/DATA/threeReads.dat");
    var buffer = await reader.Read(2);
    var str = buffer?.buffer.toString();
    expect(str).toBe("third value");
    await reader.Close();
}); */

/* test('Extra Read', async () => {
    var writer = new RecordWriter("./test/DATA/extraRead.dat");
    await writer.Clear();
    await writer.Write(Buffer.from("test value"));
    await writer.Close();

    var reader = new RecordReader("./test/DATA/extraRead.dat");
    var buffer = await reader.Read();
    expect(buffer).toBeTruthy();
    buffer = await reader.Read();
    expect(buffer).toBeFalsy();
    await reader.Close();
}); */

test('A Lot of Data', async () => {
    var writer = new RecordWriter("./test/DATA/aLotOfData.dat");
    await writer.Clear();
    for(var x=0; x<50000; x++)
        writer.Write(Buffer.from(`This is the ${x}th record in the file`));

    await writer.Close();

    var s = Date.now();
    var reader = new RecordReader("./test/DATA/aLotOfData.dat");
    var lastRecord = null;
    var thisRecord = null;
    var count = 0;
    // for await(thisRecord of reader.ReadAll()) {
    while(thisRecord = await reader.Read()) {
        count++;
        lastRecord = thisRecord;
    }

    expect(count).toBe(50000);
    var str = lastRecord?.buffer.toString();
    expect(str).toBe('This is the 49999th record in the file');
    reader.Close();
    var e = Date.now();
    console.log("Read 50000 records in: " + (e - s) + "ms");
});

test('A Lot of Data Indexed', async () => {
    var writer = new RecordWriter("./test/DATA/aLotOfDataIndexed.dat");
    var offsetPromises: Promise<number>[] = [];
    await writer.Clear();
    for(var x=0; x<50000; x++)
        offsetPromises.push(writer.Write(Buffer.from(`This is the ${x}th record in the file`)));

    await writer.Close();

    var offsets = await Promise.all(offsetPromises);
    var randomIndexes: number[] = [];

    for(var x=0; x<4000; x++) {
        var ind = Math.floor(Math.random() * (offsets.length));
        randomIndexes.push(ind);
    }

    randomIndexes = [...new Set(randomIndexes)];

    randomIndexes.sort((a, b) => a-b);
    var randomOffsets = randomIndexes.map(index => offsets[index]);

    var s = Date.now();

    var reader = new RecordReader("./test/DATA/aLotOfDataIndexed.dat", randomOffsets);
    var buffers: Buffer[] = [];

    var buffer: OffsetBuffer | null;
    // for await(buffer of reader.ReadAll()) {
    while(buffer = await reader.Read()) {
        buffers.push(buffer?.buffer);
    }
    await reader.Close();
    var e = Date.now();

    expect(buffers.length).toBe(randomOffsets.length);
    var strings = buffers.map(b => b?.toString());
    for(var x=0; x<buffers.length; x++) {
        expect(buffers[x]).toBeTruthy();
        expect(strings[x]).toBe(`This is the ${randomIndexes[x]}th record in the file`);
    }

    
    console.log("Read " + randomIndexes.length + " indexed records in: " + (e - s) + "ms");

    var randomIndex = Math.floor(Math.random() * randomIndexes.length);
    var randomOffset = randomOffsets[randomIndex];
    s = Date.now();

    var reader = new RecordReader("./test/DATA/aLotOfDataIndexed.dat", [randomOffset]);
    buffers = [];
    while(buffer = await reader.Read()) {
        buffers.push(buffer.buffer);
    }
    await reader.Close();

    expect(buffers.length).toBe(1);
    var str = buffers[0].toString();
    expect(str).toBe(`This is the ${randomIndexes[randomIndex]}th record in the file`);

    e = Date.now();
    console.log("Read a single indexed records in: " + (e - s) + "ms");
});

test('Compression', async () => {
    var writer = new RecordWriter("./test/DATA/compression.dat");
    await writer.Clear();
    for(var x=0; x<10000; x++) {
        var buffer = Buffer.from(`This is the ${x}th record in the file`);
        var result = await new Promise<Buffer>((resolve, reject) => 
            zlib.deflateRaw(buffer, (err, result) => {
                if(err)
                    reject(err);
                else
                    resolve(result);
            })
        );
        writer.Write(result);
    }

    await writer.Close();

    var reader = new RecordReader("./test/DATA/compression.dat");
    var lastRecord: Buffer | null = null;
    var thisRecord: OffsetBuffer | null = null;
    var count = 0;
    // while(thisRecord = await reader.Read()) {
    // for await(thisRecord of reader.ReadAll()) {
    while(thisRecord = await reader.Read()) {
        count++;
        lastRecord = await new Promise((resolve, reject) => 
            zlib.inflateRaw(thisRecord?.buffer as Buffer, (err, result) => {
                if(err)
                    reject(err);
                else
                    resolve(result);
            })
        );
    }

    expect(count).toBe(10000);
    expect(lastRecord).toBeTruthy();
    if(lastRecord !== null) {
        var str = lastRecord.toString();
        expect(str).toBe('This is the 9999th record in the file');
    }

    await reader.Close();
});

test('Very Long Record', async () => {
    var record = "";
    for(var x=0; x<10000; x++)
        record += " this is the body of the record ";

    var writer = new RecordWriter("./test/DATA/veryLongRecord.dat");
    await writer.Clear();
    var buffer = Buffer.from(record);
    writer.Write(buffer);

    await writer.Close();

    var reader = new RecordReader("./test/DATA/veryLongRecord.dat");
    var readBuffer = await reader.Read();
    var str = readBuffer?.buffer.toString();
    reader.Close();

    expect(str).toBe(record);
});

test('Very Long Record - Compressed', async () => {
    var record = "";
    for(var x=0; x<10000; x++)
        record += " this is the body of the record ";

    var writer = new RecordWriter("./test/DATA/veryLongRecordCompressed.dat");
    await writer.Clear();
    var buffer = Buffer.from(record);
    var result = await new Promise<Buffer>((resolve, reject) => 
            zlib.deflateRaw(buffer, (err, result) => {
                if(err)
                    reject(err);
                else
                    resolve(result);
            })
        );
    writer.Write(result);

    await writer.Close();

    var reader = new RecordReader("./test/DATA/veryLongRecordCompressed.dat");
    var readBuffer = await reader.Read();
    var buffer = readBuffer?.buffer as Buffer;
    var recordBuffer = await new Promise<Buffer>((resolve, reject) => 
            zlib.inflateRaw(buffer, (err, result) => {
                if(err)
                    reject(err);
                else
                    resolve(result);
            })
        );
    var str = recordBuffer.toString();
    reader.Close();

    expect(str).toBe(record);
});