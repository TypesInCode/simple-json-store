"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZlibJsonStore = void 0;
const jsonStore_1 = require("./jsonStore");
const zlib_1 = __importDefault(require("zlib"));
class ZlibJsonStore extends jsonStore_1.JsonStore {
    async ToBuffer(record) {
        var buffer = await super.ToBuffer(record);
        return new Promise(function (resolve, reject) {
            zlib_1.default.deflateRaw(buffer, function (err, result) {
                if (err)
                    reject(err);
                else
                    resolve(result);
            });
        });
    }
    async FromBuffer(buffer) {
        var inflated = await new Promise(function (resolve, reject) {
            zlib_1.default.inflateRaw(buffer, function (err, result) {
                if (err)
                    reject(err);
                else
                    resolve(result);
            });
        });
        return super.FromBuffer(inflated);
    }
}
exports.ZlibJsonStore = ZlibJsonStore;
