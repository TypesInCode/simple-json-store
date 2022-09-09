import fs from "fs";
import { OffsetBuffer } from "./recordReader";

function IfConcat(first: Buffer | null, second: Buffer | null) {
    return first !== null && second !== null ? Buffer.concat([first, second]) : first !== null ? first : second !== null ? second : Buffer.alloc(0);
}

export class RecordFileReader {

    private partialRecordRemaining = 0;
    private partialRecord: Buffer | null = null;

    private partialSizeRemaining = 0;
    private partialSize: Buffer | null = null;

    private startOffset = 0;
    private offsetIndex = 0;
    private bytesRead = 0;
    private chunkBytesRead = 0;
    private readComplete = false;

    private readStream: fs.ReadStream;
    private readRecordsIndex = 0;
    private readRecords: OffsetBuffer[] = [];

    private streamError: Error | null = null;
    public get StreamError() {
        return this.streamError;
    }

    private get AllOffsetsRead() {
        return this.offsets !== undefined && this.offsetIndex >= this.offsets.length;
    }

    constructor(filePath: string, private offsets?: number[]) {
        if(offsets !== undefined && offsets.length > 0) {
            offsets.sort(function(a, b) {
                return a-b;
            });

            this.startOffset = offsets[0];
            this.offsets = offsets.map(ofs => ofs - this.startOffset);
        }
        
        this.readStream = fs.createReadStream(filePath, { start: this.startOffset });
        this.readStream.on("error", (err) => this.streamError = err);
        this.readStream.on("data", (chunk: Buffer) => {
            this.ReadRecords(chunk);
        });
        this.readStream.on("end", () => {
            this.readComplete = true;
        });
    }

    public async Read() {
        var next = this.GetNextReadRecord();
        if(next !== null)
            return next;

        if(this.readComplete || this.streamError !== null)
            return null;

        return new Promise<OffsetBuffer | null>(resolve => {
            var resolved = false;
            var data = () => {
                if(resolved)
                    return;

                var next = this.GetNextReadRecord();
                if(next !== null) {
                    resolved = true;
                    this.readStream.off("data", data);
                    this.readStream.off("end", end);
                    this.readStream.off("error", error);
                    resolve(next);
                }
                else if(this.AllOffsetsRead) {
                    resolved = true;
                    this.Close();
                    resolve(null);
                }
            }

            var end = () => {
                if(resolved)
                    return;
                
                resolved = true;
                this.readStream.off("data", data);
                this.readStream.off("end", end);
                this.readStream.off("error", error);
                resolve(null);
            }

            var error = () => {
                if(resolved)
                    return;

                resolved = true;
                this.readStream.off("data", data);
                this.readStream.off("end", end);
                this.readStream.off("error", error);
                resolve(null);
            };

            this.readStream.on("data", data);
            this.readStream.on("end", end);
            this.readStream.on("error", error);
        });
    }

    public Close() {
        this.readStream.destroy();
        this.readRecords = [];
        this.readComplete = true;
    }

    private GetNextReadRecord() {
        if(this.readRecordsIndex < this.readRecords.length) {
            var ret = this.readRecords[this.readRecordsIndex++];
            if(this.readRecordsIndex === this.readRecords.length) {
                this.readRecordsIndex = 0;
                this.readRecords = [];
            }

            return ret;
        }

        return null;
    }

    private ReadRecords(chunk: Buffer) {
        var buffer: Buffer | null = null;
        while(buffer = this.ReadRecordFromChunk(chunk))
            this.readRecords.push({ offset: this.startOffset + this.bytesRead + (this.chunkBytesRead - 4 - buffer.length), buffer: buffer });

        this.bytesRead += chunk.length;
        this.chunkBytesRead = 0;
    }

    private ReadRecordFromChunk(chunk: Buffer) {        
        if(this.partialRecordRemaining > 0) {
            this.chunkBytesRead += this.partialRecordRemaining;
            return this.GetNextRecord(chunk, this.partialRecordRemaining, 0);
        }
        
        var sizeBuffer: Buffer | null = null;
        if(this.partialSizeRemaining > 0) {
            this.chunkBytesRead += this.partialSizeRemaining;
            sizeBuffer = this.GetNextSize(chunk, this.partialSizeRemaining, 0);
        }
        else {
            var nextChunkOffset = this.GetNextChunkOffset();
            if(nextChunkOffset > -1) {
                this.chunkBytesRead = nextChunkOffset + 4;
                sizeBuffer = this.GetNextSize(chunk, 4, nextChunkOffset);
            }
        }

        if(sizeBuffer !== null) {
            var view = new DataView(sizeBuffer.buffer);
            var recordSize = view.getUint32(sizeBuffer.byteOffset);
            var ret = this.GetNextRecord(chunk, recordSize, this.chunkBytesRead);
            this.chunkBytesRead += recordSize;
            this.offsetIndex++;
            return ret;
        }

        return null;
    }

    private GetNextChunkOffset() {
        if(this.offsets !== undefined) {
            if(this.offsetIndex >= this.offsets.length)
                return -1;
            
            var offset = this.offsets[this.offsetIndex] - this.bytesRead;
            if(offset < 0)
                offset = 0;

            return offset;
        }

        return this.chunkBytesRead;
    }

    private GetNextRecord(chunk: Buffer, size: number, offset: number) {
        var record = chunk.slice(offset, offset + size);
                
        this.partialRecordRemaining = size - record.length;
        if(this.partialRecordRemaining > 0) {
            this.partialRecord = IfConcat(this.partialRecord, record);
            return null;
        }

        var ret = IfConcat(this.partialRecord, record);
        this.partialRecord = null;
        return ret;
    }

    private GetNextSize(chunk: Buffer, take: number, offset: number) {
        var size = chunk.slice(offset, offset + take);
        if(size.length === 0)
            return null;
        
        this.partialSizeRemaining = take - size.length;
        if(this.partialSizeRemaining > 0) {
            this.partialSize = IfConcat(this.partialSize, size);
            return null;
        }

        var ret = IfConcat(this.partialSize, size);
        this.partialSize = null;
        return ret;
    }
}