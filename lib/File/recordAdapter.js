"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordAdapter = void 0;
const recordReader_1 = require("./recordReader");
const recordWriter_1 = require("./recordWriter");
class RecordAdapter {
    constructor(filePath) {
        this.filePath = filePath;
        this.readPromises = new Set();
        this.writePromise = Promise.resolve();
        this.closePromise = Promise.resolve();
        this.pausePromise = Promise.resolve();
        this.recordWriter = null;
    }
    get Pending() {
        return Promise.all([this.pausePromise, this.closePromise, this.writePromise, ...this.readPromises.values()]);
    }
    get CloseWrite() {
        return Promise.all([this.pausePromise, this.closePromise, this.writePromise]);
    }
    /* public async Read(callback: {(reader: RecordReader): Promise<void>}) {
        var readPromise = this.ReadCallback(callback);
        this.readPromises.add(readPromise);
        await readPromise;
        this.readPromises.delete(readPromise);
    } */
    async Read(offset = 0) {
        var buffer = null;
        var readPromise = this.ReadCallback(async (reader) => {
            buffer = await reader.Read();
        }, offset);
        this.readPromises.add(readPromise);
        await readPromise;
        this.readPromises.delete(readPromise);
        return buffer;
        /* await this.EndWrite();

        var reader = new RecordReader(this.filePath, offset);
        var readPromise = reader.Read();
        this.readPromises.add(readPromise);
        var buffer = await readPromise;
        this.readPromises.delete(readPromise);
        return buffer; */
    }
    async ReadAll(callback) {
        await this.EndWrite();
        var reader = new recordReader_1.RecordReader(this.filePath);
        var readPromise = callback(reader.ReadAll());
        this.readPromises.add(readPromise);
        await readPromise;
        await reader.Close();
        this.readPromises.delete(readPromise);
    }
    async Write(callback) {
        this.writePromise = this.WriteCallback(callback);
        await this.writePromise;
    }
    async Close() {
        this.closePromise = this.CloseAdapter();
        await this.closePromise;
    }
    async Pause(callback) {
        this.pausePromise = this.PauseAdapter(callback);
        await this.pausePromise;
    }
    async PauseAdapter(callback) {
        await this.Pending;
        this.recordWriter = null;
        await callback();
    }
    async CloseAdapter() {
        var _a;
        await this.Pending;
        await ((_a = this.recordWriter) === null || _a === void 0 ? void 0 : _a.Close());
        this.recordWriter = null;
    }
    async ReadCallback(callback, offset = 0) {
        await this.EndWrite();
        var reader = new recordReader_1.RecordReader(this.filePath, offset);
        await callback(reader);
        await reader.Close();
    }
    async EndWrite() {
        var writer = this.recordWriter;
        this.recordWriter = null;
        await this.CloseWrite;
        await (writer === null || writer === void 0 ? void 0 : writer.Close());
    }
    async WriteCallback(callback) {
        await this.Pending;
        this.recordWriter = this.recordWriter || new recordWriter_1.RecordWriter(this.filePath);
        await callback(this.recordWriter);
    }
}
exports.RecordAdapter = RecordAdapter;
