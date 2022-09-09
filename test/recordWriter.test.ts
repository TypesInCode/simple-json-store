import { RecordWriter } from "../src/File/recordWriter";
import fs from "fs";

test('Create Writer', async () => {
    var writer = new RecordWriter("./test/DATA/createWriter.dat");
    await writer.Clear();
    var buffer = Buffer.from("Sample data is here");
    await writer.Write(buffer);
    await writer.Write(Buffer.from("Second line of sample data"));
    await writer.Close()

    var exists = fs.existsSync("./test/DATA/createWriter.dat");
    expect(exists).toBe(true);
});