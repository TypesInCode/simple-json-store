"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonIndex = void 0;
class JsonIndex {
    constructor() {
        // prop -> value -> id's
        this.data = new Map();
        this.indexMap = new Map();
    }
    get Indexed() {
        return new Set(this.indexMap.keys());
    }
    get Values() {
        return this.data.values();
    }
    Set(object) {
        // this.Delete(object);
        this.Delete(object._id);
        this.data.set(object._id, object);
        this.AddToIndex(object);
    }
    Has(id) {
        return this.data.has(id);
    }
    Get(id) {
        return this.data.get(id);
    }
    Delete(id) {
        var curr = this.data.get(id);
        if (curr === undefined)
            return false;
        this.data.delete(id);
        var object = curr;
        this.indexMap.forEach(function (index, key) {
            var objectValue = object[key];
            var idSet = index.get(objectValue);
            if (idSet !== undefined)
                idSet.delete(object._id);
        });
        return true;
    }
    Clear() {
        this.data.clear();
        this.indexMap.clear();
    }
    Query(query) {
        var properties = this.GetQueryProperties(query); // Reflect.ownKeys(query) as Array<keyof T>;
        this.EnsureIndex(properties);
        var idSets = properties.map(prop => this.GetIdSet(prop, this.GetValue(query, prop)));
        if (idSets.length === 0)
            return [];
        var first = [...idSets[0]];
        if (idSets.length === 1)
            return first.map(id => this.data.get(id));
        return first.filter(function (id) {
            for (var x = 1; x < idSets.length && idSets[x].has(id); x++) { }
            return x === idSets.length;
        }).map(id => this.data.get(id));
    }
    GetQueryProperties(query) {
        var properties = Reflect.ownKeys(query);
        properties = properties.reduce((pre, curr) => {
            if (query[curr] !== null && typeof query[curr] === 'object')
                pre.push(...this.GetQueryProperties(query[curr]).map(child => `${curr}.${child}`));
            else
                pre.push(curr);
            return pre;
        }, []);
        return properties;
        // var objectProperties = properties.filter(prop => typeof query[prop] === 'object')
    }
    AddToIndex(object) {
        this.indexMap.forEach((index, key) => {
            var objectValue = this.GetValue(object, key);
            // var objectValue = object[key];
            var idSet = index.get(objectValue);
            if (idSet === undefined) {
                idSet = new Set();
                index.set(objectValue, idSet);
            }
            idSet.add(object._id);
        });
    }
    GetValue(object, prop) {
        return prop.split(".").reduce((pre, curr) => {
            if (pre === undefined || pre === null)
                return pre;
            return pre[curr];
        }, object);
    }
    GetIdSet(property, value) {
        if (value === undefined)
            return new Set();
        var valueMap = this.indexMap.get(property);
        return (valueMap === null || valueMap === void 0 ? void 0 : valueMap.get(value)) || new Set();
    }
    EnsureIndex(properties) {
        var missingProperties = [];
        for (var x = 0; x < properties.length; x++)
            if (!this.indexMap.has(properties[x]))
                missingProperties.push(properties[x]);
        for (var x = 0; x < missingProperties.length; x++)
            this.indexMap.set(missingProperties[x], new Map());
        if (missingProperties.length > 0)
            this.RebuildIndex();
    }
    RebuildIndex() {
        this.data.forEach(value => this.AddToIndex(value));
        /* await this.dataCallback(async generator => {
            for await(var object of generator)
                this.Add(object);
        }); */
        /* var generator = this.getGenerator();
        for await(var object of generator)
            this.Add(object); */
    }
}
exports.JsonIndex = JsonIndex;
