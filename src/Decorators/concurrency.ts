const objectMap = new WeakMap<object, Map<string, Set<Promise<any>>>>();

function GetPromises(propMap: Map<string, Set<Promise<any>>>, skipProperty?: string) {
    var promises: Promise<any>[] = [];
    propMap.forEach(function(value, key) {
        if(skipProperty === key)
            return;

        promises.push(...value);
    });
    return promises;
}

async function AwaitAndInvoke(propMap: Map<string, Set<Promise<any>>>, func: { (...args: any[]): any }, args: any[], skipProperty?: string) {
    var promises = GetPromises(propMap, skipProperty);
    if(promises.length > 0)
        await Promise.all(GetPromises(propMap, skipProperty));
    
    return func(...args);
}

async function ClassMethod(object: object, func: {(...args: any[]): any }, args: any[], property: string, multiple = false) {
    var propMap = objectMap.get(object);
    if(propMap === undefined)
        throw new Error("Unabled to find property map for object");

    var propSet = propMap.get(property);
    if(propSet === undefined) {
        propSet = new Set();
        propMap.set(property, propSet);
    }

    var promise = AwaitAndInvoke(propMap, func, args, multiple ? property : undefined);
    propSet.add(promise);
    var ret = await promise;
    propSet.delete(promise);
    return ret;
}

export function Concurrency<T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {

        constructor(...args: any[]) {
            super(...args);
            objectMap.set(this, new Map());
        }

    }
}

export namespace Concurrency {

    export function Awaiting(object: object) {
        var propMap = objectMap.get(object);
        if(propMap === undefined)
            return [];

        return GetPromises(propMap);
    }

}

export function Single<T extends Record<K, { (...args: any[]): Promise<any> }>, K extends string>(target: T, propertyKey: K, descriptor: PropertyDescriptor) {
    var func = descriptor.value;

    descriptor.value = async function(...args: any[]) {
        return ClassMethod(this, func.bind(this), args, propertyKey);
    }
}

export function Multiple(propertyOverride?: string) {

    return function <T extends Record<K, { (...args: any[]): Promise<any> }>, K extends string>(target: T, propertyKey: K, descriptor: PropertyDescriptor) {
        var func = descriptor.value;
    
        descriptor.value = async function(...args: any[]) {
            return ClassMethod(this, func.bind(this), args, propertyOverride || propertyKey, true);
        }
    }
}

/* export function Multiple<T extends Record<K, { (...args: any[]): Promise<any> }>, K extends string>(target: T, propertyKey: K, descriptor: PropertyDescriptor) {
    var func = descriptor.value;

    descriptor.value = async function(...args: any[]) {
        return ClassMethod(this, func, args, propertyKey, true);
    }
} */