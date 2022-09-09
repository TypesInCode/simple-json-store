import { RecordFileReader } from "./recordFileReader";

export type OffsetBuffer = { offset: number, buffer: Buffer };

export class RecordReader {

    private readerIndex = 0;
    // private recordFileReader: RecordFileReader;
    private recordFileReaders: RecordFileReader[];

    /* public get Error() {
        return this.recordFileReader.StreamError;
    } */

    constructor(filePath: string, offsets?: number[]) {
        /* if(offsets !== undefined && offsets.length > 1000) {
            var skip = Math.floor(offsets.length / 3);
            this.recordFileReaders = [
                new RecordFileReader(filePath, offsets.slice(0, skip)),
                new RecordFileReader(filePath, offsets.slice(skip, skip + skip)),
                new RecordFileReader(filePath, offsets.slice(skip + skip))
            ];
        } 
        else */
            this.recordFileReaders = [new RecordFileReader(filePath, offsets)];
    }

    public async Read(skip = 0): Promise<OffsetBuffer | null> {
        if(this.readerIndex >= this.recordFileReaders.length)
            return null;

        for(var x=0; x<skip; x++)
            this.Read();

        var ret = await this.recordFileReaders[this.readerIndex].Read();
        if(ret === null) {
            this.readerIndex++;
            return this.Read(skip);
        }

        return ret;

        //return this.recordFileReader.Read();
    }

    /* public async Read(skip = 0) {
        var count = 0;

        var ret: OffsetBuffer | null = null;
        while(count <= skip && (ret = await this.recordFileReader.Read()))
            count++;

        return ret;
    } */

    public Close() {
        // this.recordFileReader.Close();
        for(var x=0; x<this.recordFileReaders.length; x++)
            this.recordFileReaders[x].Close();
    }

}