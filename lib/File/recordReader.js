"use strict";
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordReader = void 0;
const fs_1 = __importDefault(require("fs"));
class RecordReader {
    constructor(filePath, offset = 0) {
        this.readIndex = 0;
        this.records = [];
        this.recordRemaining = 0;
        this.readComplete = false;
        try {
            fs_1.default.statSync(filePath);
            this.readStream = fs_1.default.createReadStream(filePath, { start: offset });
            this.readStream.pause();
            this.readStream.on("end", () => {
                this.readComplete = true;
            });
        }
        catch (err) {
            this.fileError = err;
            this.readComplete = true;
        }
    }
    get FileError() {
        return this.fileError;
    }
    ReadAll() {
        return __asyncGenerator(this, arguments, function* ReadAll_1() {
            var buffer;
            while (buffer = yield __await(this.Read()))
                yield yield __await(buffer);
        });
    }
    async Read() {
        if (this.readIndex < this.records.length) {
            var record = this.records[this.readIndex++];
            if (this.readIndex >= this.records.length) {
                this.readIndex = 0;
                this.records = [];
            }
            return record;
        }
        if (this.readComplete)
            return null;
        return new Promise(resolve => {
            var resolved = false;
            var readableCallback = () => {
                this.ReadData();
                if (this.readIndex < this.records.length) {
                    this.readStream.off("readable", readableCallback);
                    this.readStream.off("end", endCallback);
                    this.readStream.pause();
                    resolve(this.records[this.readIndex++]);
                    resolved = true;
                    if (this.readIndex >= this.records.length) {
                        this.readIndex = 0;
                        this.records = [];
                    }
                }
            };
            var endCallback = () => {
                this.readStream.off("readable", readableCallback);
                this.readStream.off("end", endCallback);
                !resolved && resolve(null);
            };
            this.readStream.on("readable", readableCallback);
            this.readStream.on("end", endCallback);
            this.readStream.resume();
        });
    }
    async Close() {
        var _a;
        (_a = this.readStream) === null || _a === void 0 ? void 0 : _a.destroy();
    }
    ReadData() {
        this.ReadPartialData();
        var lengthBuffer = this.readStream.read(4);
        var view = null;
        while (lengthBuffer) {
            view = new DataView(lengthBuffer.buffer);
            var length = view.getUint32(lengthBuffer.byteOffset);
            var recordBuffer = this.readStream.read(length);
            if (!recordBuffer || recordBuffer.length < length) {
                recordBuffer = this.readStream.read();
                this.recordRemaining = length - (recordBuffer && recordBuffer.length || 0);
                this.partialRecord = recordBuffer || Buffer.alloc(0);
            }
            else
                this.records.push(recordBuffer);
            lengthBuffer = this.readStream.read(4);
        }
    }
    ReadPartialData() {
        if (this.recordRemaining > 0 && this.partialRecord !== null) {
            var remainingChunk = this.readStream.read(this.recordRemaining);
            if (!remainingChunk)
                remainingChunk = this.readStream.read();
            this.recordRemaining -= remainingChunk && remainingChunk.length || 0;
            var partialRecord = remainingChunk && Buffer.concat([this.partialRecord, remainingChunk]) || this.partialRecord;
            if (this.recordRemaining > 0)
                this.partialRecord = partialRecord;
            else
                this.records.push(partialRecord);
        }
    }
}
exports.RecordReader = RecordReader;
