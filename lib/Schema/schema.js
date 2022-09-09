"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schema = exports.Inherit = exports.Limit = exports.Max = exports.Upper = void 0;
function DateStringFunc(val) {
    var ticks = Date.parse(val);
    if (!isNaN(ticks))
        return (new Date(ticks)).toISOString();
    return "";
}
function AssertType(val, typeFunc) {
    val = typeFunc(val);
    return val;
}
function AssertSchema(val, schema) {
    if (typeof val !== 'object' || Array.isArray(val))
        throw new Error("Can only assert schemas on objects");
    var ret = {};
    for (var key in val)
        if (schema[key])
            ret[key] = schema[key](val[key]);
    return ret;
}
function Upper(func) {
    return (val) => {
        val = func(val);
        val = val && val.toUpperCase();
        return val;
    };
}
exports.Upper = Upper;
function Max(max, func) {
    return (val) => {
        val = func(val);
        if (typeof val === 'string' && val.length > max)
            return val.slice(0, max);
        else if (typeof val === 'number' && val > max)
            return max;
        return val;
    };
}
exports.Max = Max;
function Limit(max, func) {
    return (val) => {
        val = func(val);
        if (val.length > max)
            return val.slice(0, max);
        return val;
    };
}
exports.Limit = Limit;
function Inherit(schema1, schema2) {
    var newSchema = {};
    for (let key in schema1)
        newSchema[key] = schema1[key];
    for (let key2 in schema2)
        newSchema[key2] = schema2[key2];
    return newSchema;
}
exports.Inherit = Inherit;
const ArrayType = Array;
const NumberType = Number;
const StringType = String;
const BooleanType = Boolean;
var Schema;
(function (Schema) {
    Schema.String = (val) => AssertType(val, StringType);
    Schema.Number = (val) => AssertType(val, NumberType);
    Schema.Boolean = (val) => AssertType(val, BooleanType);
    Schema.DateString = (val) => AssertType(val, DateStringFunc);
    function Array(func) {
        return (val) => {
            if (!ArrayType.isArray(val))
                return [];
            return val.map(func);
        };
    }
    Schema.Array = Array;
    function Dictionary(func) {
        return (val) => {
            var ret = {};
            if (!val || typeof val !== "object" || ArrayType.isArray(val))
                return ret;
            for (var key in val)
                ret[key] = func(val[key]);
            return ret;
        };
    }
    Schema.Dictionary = Dictionary;
    function ToFunction(schema) {
        return (val) => AssertSchema(val, schema);
    }
    Schema.ToFunction = ToFunction;
    /* export function GetSchema<T>(type: { new(): T }): SchemaFunc<T> {
        if(!schemaMap.has(type))
            throw new Error("No schema found for type: " + type.name);
        
        return schemaMap.get(type) as SchemaFunc<T>;
    }

    export function GetName(type: { new(): any }) {
        if(schemaMap.has(type))
            return type.name;

        throw new Error("Type " + type.name + " is not registered");
    }

    export function GetType(name: string) {
        return schemaNameMap.get(name);
    } */
})(Schema = exports.Schema || (exports.Schema = {}));
