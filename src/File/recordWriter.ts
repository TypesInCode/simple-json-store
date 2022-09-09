import fs from "fs";

export class RecordWriter {

    private initPromise: Promise<void>
    private writeStream!: fs.WriteStream;
    private currentOffset!: number;

    constructor(private filePath: string) {
        this.initPromise = this.Init();
    }

    public async Clear() {
        await this.initPromise;
        this.writeStream.destroy();
        return new Promise<void>((resolve) => {
            fs.unlink(this.filePath, () => {
                this.currentOffset = 0;
                this.writeStream = fs.createWriteStream(this.filePath, { flags: "a+"});
                resolve();
            });
        });
    }

    public async Write(buffer: Buffer) {
        await this.initPromise;
        /* var sizeBuffer = Buffer.alloc(4);
        var view = new DataView(sizeBuffer.buffer);
        view.setUint32(0, buffer.length); */

        return new Promise<number>((resolve, reject) => {
            var sizeBuffer = Buffer.alloc(4);
            var view = new DataView(sizeBuffer.buffer);
            view.setUint32(0, buffer.length);

            var offset = this.currentOffset;
            this.writeStream.write(sizeBuffer);
            this.writeStream.write(buffer, (err) => {
                if(err)
                    reject(err);
                else
                    resolve(offset);
            });
            this.currentOffset += sizeBuffer.length + buffer.length;
        });
    }

    public async Close() {
        await this.initPromise;
        await new Promise<void>(resolve => {
            this.writeStream.end(resolve);
        });
    }

    private Init() {
        return new Promise<void>((resolve, reject) => {
            fs.stat(this.filePath, (err, stat) => {
                this.currentOffset = err ? 0 : stat.size;
                this.writeStream = fs.createWriteStream(this.filePath, { flags: "a+"});
                this.writeStream.on("error", () => {
                    console.error("error encountered opening file: " + this.filePath);
                });
                resolve();
            });
        });
    }

}