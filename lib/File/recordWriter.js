"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordWriter = void 0;
const fs_1 = __importDefault(require("fs"));
class RecordWriter {
    constructor(filePath) {
        this.filePath = filePath;
        this.initPromise = this.Init();
    }
    async Clear() {
        await this.initPromise;
        this.writeStream.destroy();
        return new Promise((resolve) => {
            fs_1.default.unlink(this.filePath, () => {
                this.currentOffset = 0;
                this.writeStream = fs_1.default.createWriteStream(this.filePath, { flags: "a+" });
                resolve();
            });
        });
    }
    async Write(buffer) {
        await this.initPromise;
        var sizeBuffer = Buffer.alloc(4);
        var view = new DataView(sizeBuffer.buffer);
        view.setUint32(0, buffer.length);
        return new Promise((resolve, reject) => {
            var sizeBuffer = Buffer.alloc(4);
            var view = new DataView(sizeBuffer.buffer);
            view.setUint32(0, buffer.length);
            var offset = this.currentOffset;
            this.writeStream.write(sizeBuffer);
            this.writeStream.write(buffer, (err) => {
                if (err)
                    reject(err);
                else
                    resolve(offset);
            });
            this.currentOffset += sizeBuffer.length + buffer.length;
        });
    }
    async Close() {
        await this.initPromise;
        await new Promise(resolve => {
            this.writeStream.end(resolve);
        });
    }
    Init() {
        return new Promise((resolve, reject) => {
            fs_1.default.stat(this.filePath, (err, stat) => {
                this.currentOffset = err ? 0 : stat.size;
                this.writeStream = fs_1.default.createWriteStream(this.filePath, { flags: "a+" });
                resolve();
            });
        });
    }
}
exports.RecordWriter = RecordWriter;
