"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonStore = void 0;
const recordWriter_1 = require("../File/recordWriter");
const fs_1 = __importDefault(require("fs"));
const recordAdapter_1 = require("../File/recordAdapter");
const jsonIndex_1 = require("./jsonIndex");
class JsonStore {
    constructor(filePath) {
        this.filePath = filePath;
        this.compressing = Promise.resolve();
        // protected index: Map<string, T> = new Map();
        this.index = new jsonIndex_1.JsonIndex();
        this.adapter = new recordAdapter_1.RecordAdapter(filePath);
        this.InitStore();
    }
    get Pending() {
        return this.adapter.Pending;
    }
    Has(id) {
        return this.index.Has(id);
    }
    Set(value) {
        this.SetCache(value);
        var record = this.ToRecord(value._id, "set", value);
        this.Write(record);
    }
    Get(id) {
        return this.index.Get(id);
    }
    Query(query) {
        return this.index.Query(query);
    }
    Delete(id) {
        var deleted = this.DeleteCache(id);
        if (deleted) {
            var record = this.ToRecord(id, "delete");
            this.Write(record);
        }
        return deleted;
    }
    async Clear() {
        await this.ClearStore();
    }
    async Compress() {
        this.compressing = this.CompressStore();
        await this.compressing;
    }
    async Close() {
        await this.adapter.Close();
    }
    SetCache(value) {
        // this.index.set(value._id, value);
        this.index.Set(value);
    }
    DeleteCache(id) {
        // return this.index.delete(id);
        return this.index.Delete(id);
    }
    async ToBuffer(record) {
        var jsonStr = JSON.stringify(record);
        return Buffer.from(jsonStr);
    }
    async FromBuffer(buffer) {
        var jsonStr = buffer.toString();
        try {
            return JSON.parse(jsonStr);
        }
        catch (err) {
            return null;
        }
    }
    ToRecord(id, action, value) {
        switch (action) {
            case "delete":
                return [id, "delete"];
            case "set":
                if (value !== undefined)
                    return [id, "set", value];
                break;
        }
        throw new Error("Argument exception");
    }
    async Write(record) {
        await this.adapter.Write(async (writer) => {
            var buffer = await this.ToBuffer(record);
            await writer.Write(buffer);
        });
    }
    async InitStore() {
        this.index.Clear();
        await this.adapter.ReadAll(async (reader) => {
            var e_1, _a;
            try {
                for (var reader_1 = __asyncValues(reader), reader_1_1; reader_1_1 = await reader_1.next(), !reader_1_1.done;) {
                    var buffer = reader_1_1.value;
                    let record = await this.FromBuffer(buffer);
                    if (record !== null)
                        switch (record[1]) {
                            case "set":
                                this.SetCache(record[2]);
                                break;
                            case "delete":
                                this.DeleteCache(record[0]);
                                break;
                        }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (reader_1_1 && !reader_1_1.done && (_a = reader_1.return)) await _a.call(reader_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
        /* await this.adapter.Read(async reader => {
            var buffer: Buffer | null = null;
            while(buffer = await reader.Read()) {
                let record = await this.FromBuffer(buffer);
                if(record !== null)
                    switch(record[1]) {
                        case "set":
                            this.SetCache(record[2]);
                            break;
                        case "delete":
                            this.DeleteCache(record[0]);
                            break;
                    }
            }
        }); */
    }
    async ClearStore() {
        this.adapter.Write(async (writer) => await writer.Clear());
        await this.adapter.Pause(async () => this.index.Clear());
    }
    async CompressStore() {
        this.adapter.Close();
        this.adapter.Pause(async () => {
            var compressedPath = `${this.filePath}.compressing`;
            try {
                await fs_1.default.promises.unlink(compressedPath);
            }
            catch (err) { }
            var compressedWriter = new recordWriter_1.RecordWriter(compressedPath);
            for (var value of this.index.Values) {
                var record = this.ToRecord(value._id, "set", value);
                var buffer = await this.ToBuffer(record);
                await compressedWriter.Write(buffer);
            }
            await compressedWriter.Close();
            await fs_1.default.promises.rename(this.filePath, `${this.filePath}.temp`);
            await fs_1.default.promises.rename(compressedPath, this.filePath);
            await fs_1.default.promises.unlink(`${this.filePath}.temp`);
        });
        await this.adapter.Pending;
    }
}
exports.JsonStore = JsonStore;
