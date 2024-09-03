import { Sortable, SortableType, SortableTypeEnum, QuickSort } from "../Utils/quickSort";
import { IRecord } from "./record";

export type RecursivePartial<T> = {
    [P in keyof T]?: 
        T[P] extends object ? RecursivePartial<T[P]> : T[P];
};

export type RecursiveSort<T> = {
    [P in keyof T]?: 
        T[P] extends object ? RecursiveSort<T[P]> : "ASC" | "DESC";
};

export type RecursiveIndex<T> = {
    [P in keyof T]?:
        T[P] extends object ? RecursiveIndex<T[P]> : boolean;
}

export interface JsonIndexQuery<T extends IRecord> {
    eq?: RecursivePartial<T>;
    neq?: RecursivePartial<T>;
    sort?: RecursiveSort<T>;
    gte?: RecursivePartial<T>;
    lt?: RecursivePartial<T>;
    skip?: number;
    take?: number;
}

function GetValuePropReduce(pre: any, curr: string) {
    if(pre === undefined || pre === null)
        return pre;

    return pre[curr];
}

function GetValue(object: any, prop: string) {
    return prop.split(".").reduce(GetValuePropReduce, object) as any;
}

function GetPropertyPaths(obj: any): string[] {
    if(obj === undefined || obj === null)
        return [];
    
    var properties = Object.keys(obj) as Array<string>;
    var ret: string[] = [];
    for(var x=0; x<properties.length; x++) {
        var curr = properties[x];
        var path: string;
        if(obj[curr] !== null && typeof obj[curr] === 'object')
            path = `${curr}.${GetPropertyPaths(obj[curr])}`;
        else
            path = curr;

        ret.push(path);
    }

    return ret;
}

export class JsonIndex<T extends IRecord> {
    private _idToSortableMap = new Map<string, Sortable>();
    private _pathToSortableIndex: { [path: string]: number } = {};
    private _pathToTypeToIdsArray = new Map<string, Map<SortableType, Set<string>>>();
    private _types: SortableTypeEnum[] = [];

    /* private indexMap = new Map<string, Map<SortableType, Map<string, Sortable>>>();
    private paths: string[] = [];
    private types: SortableTypeEnum[] = [] */

    public get Size() {
        /* var idMap = this.indexMap.get("_id");
        if(idMap === undefined)
            return 0;

        return idMap.size; */
        return this._idToSortableMap.size;
    }

    constructor(private buildIndex: {(index: JsonIndex<T>): Promise<void>}, indexed?: RecursiveIndex<T>) {
        var indexPaths = ["_id"];
        if(indexed !== undefined) {
            (indexed as any)._id = false;
            indexPaths.push(...GetPropertyPaths(indexed).filter(function(path) {
                return GetValue(indexed, path);
            }));
        }
        this.ensuringIndex = this.EnsureIndex(indexPaths);
    }

    public Set(object: T) {
        this.Delete(object._id);
        this.AddToIndex(object);
    }

    public Has(id: string) {
        var object = this.GetObjectById(id);
        return object !== undefined;
    }

    public Delete(id: string) {
        /* var curr = this.GetObjectById(id);
        if(curr === undefined)
            return false;
        
        var object = curr;
        for(var x=0; x<this.paths.length; x++) {
            var propMap = this.indexMap.get(this.paths[x]);
            var objectValue = object[x];
            var idMap = propMap!.get(objectValue);
            if(idMap !== undefined)
                idMap.delete(object[0] as string);
        } */
        this._idToSortableMap.delete(id);
        return true;
    }

    public Clear() {
        this._idToSortableMap.clear();
        this._pathToTypeToIdsArray.clear();
        /* this.indexMap.forEach(function(value) { 
            value.clear();
        }); */
    }

    private ensuringIndex: Promise<void> | null = null;
    public async Query(query: JsonIndexQuery<T>) {
        const properties = GetPropertyPaths(query.eq);
        const neqProperties = GetPropertyPaths(query.neq);
        const gtProperties = GetPropertyPaths(query.gte);
        const ltProperties = GetPropertyPaths(query.lt);
        const sortProperties = GetPropertyPaths(query.sort);

        const indexProperties = [
            ...properties,
            ...neqProperties,
            ...gtProperties,
            ...ltProperties,
            ...sortProperties
        ];
        this.ensuringIndex = this.EnsureIndex(indexProperties);
        await this.ensuringIndex;

        let sortable: Sortable[];
        if(properties.length > 0) {
            const idSets = properties.map(prop => this.GetIndexedValueSet(prop, GetValue(query.eq, prop)));
            if(idSets.length === 0)
                return [];

            const idSet = idSets.length === 1 ? idSets[0] : idSets.reduce((pre, curr) => {
                curr.forEach(id => pre.add(id));
                return pre;
            }, new Set<string>());
            const idSetArray = [...idSet];

            sortable = idSetArray.map(id => this._idToSortableMap.get(id)) as Sortable[];
            
            /* if(idSets.length === 1)
                sortable = [...idSets[0]];
            if(idSets.length > 1)
                sortable = sortable.filter(function(sortable) {
                    for(var x=1; x<idSets.length && idSets[x].has(sortable[0]); x++) {}
                    return x === idSets.length;
                }); */
        }
        else
            sortable = [...this.AllValues()];

        if(gtProperties.length > 0) {
            sortable = this.GtLtFilter(sortable, gtProperties, query.gte as RecursivePartial<T>, 'gt');
        }

        if(ltProperties.length > 0) {
            sortable = this.GtLtFilter(sortable, ltProperties, query.lt as RecursivePartial<T>, 'lt');
        }

        sortable = this.Sort(sortable, sortProperties, query.sort!);

        if(neqProperties.length > 0) {
            // const neqIndexes = neqProperties.map(prop => this.paths.indexOf(prop));
            const neqIndexes = neqProperties.map(prop => this._pathToSortableIndex[prop]);
            const neqValues = neqProperties.map(prop => GetValue(query.neq, prop));

            sortable = sortable.filter(function(sort) {
                for(let x=0; x<neqProperties.length; x++)
                    if(neqValues[x] === sort[neqIndexes[x]])
                        return false;

                return true;
            });
        }

        if(query.take !== undefined) {
            var skip = query.skip || 0;
            sortable = sortable.slice(skip, skip + query.take);
        }
        else if(query.skip !== undefined)
            sortable = sortable.slice(query.skip);

        return sortable.map(function(obj) {
            return obj[0];
        });
    }

    private GtLtFilter(sortable: Sortable[], properties: string[], filter: RecursivePartial<T>, dir: 'gt' | 'lt') {
        // const gtIndexes = properties.map(prop => this.paths.indexOf(prop));
        const gtIndexes = properties.map(prop => this._pathToSortableIndex[prop]);
        const gtValues = properties.map(prop => GetValue(filter, prop));
        const gtSort = this.ConvertToAscending(filter);
        
        for(let x=0; x<properties.length; x++) {
            sortable = this.Sort(sortable, [properties[x]], gtSort);
            const sortableIndex = this.SearchSortable(sortable, gtIndexes[x], gtValues[x]);
            if(dir === 'gt')
                sortable = sortableIndex === 0 ? sortable : sortable.slice(sortableIndex);
            else
                sortable = sortable.slice(0, sortableIndex);
        }

        return sortable;
    }

    private SearchSortable(sortable: Sortable[], valIndex: number, value: any, startIndex?: number, end?: number): number {
        startIndex = startIndex || 0;
        end = end === undefined ? sortable.length : end;        
        const midIndex = Math.floor((end - startIndex) / 2) + startIndex;
        if(startIndex === midIndex)
            return startIndex + 1;

        const midValue = sortable[midIndex][valIndex];
        if(value <= midValue)
            return this.SearchSortable(sortable, valIndex, value, startIndex, midIndex);
        else
            return this.SearchSortable(sortable, valIndex, value, midIndex, end);
    }

    private ConvertToAscending<T>(obj: RecursivePartial<T>): RecursiveSort<T> {
        const ret = {} as RecursiveSort<any>;
        const keys = Object.keys(obj) as string[];
        for(let x=0; x<keys.length; x++) {
            const val = (obj as any)[keys[x]];
            if(val && typeof val === 'object')
                ret[keys[x]] = this.ConvertToAscending(val);
            else
                ret[keys[x]] = 'ASC';
        }

        return ret;
    }

    private Sort(sortable: Sortable[], sortProperties: string[], sort: RecursiveSort<T>) {
        if(sortProperties.length === 0)
            return sortable;

        var sortPropertyIndexes = sortProperties.map(prop => {
            // return this.paths.indexOf(prop);
            return this._pathToSortableIndex[prop];
        });

        var sortDirs = sortProperties.map(function(path) {
            return GetValue(sort, path) === "ASC" ? 1 : -1;
        });

        QuickSort(sortable, this._types, sortPropertyIndexes, sortDirs);
        return sortable;
    }

    private UpdateTypesArray(indexed: Sortable) {
        if(this._types.length === indexed.length)
            return;

        this._types = indexed.map(function(val) {
            switch(typeof val) {
                case "string":
                    return SortableTypeEnum.string;
                case "number":
                    return SortableTypeEnum.number;
                case "boolean":
                    return SortableTypeEnum.boolean;
                default:
                    throw new Error("Invalid type found in index");
            }
        });
        /* if(this.paths.length === this.types.length)
            return;
        
        this.types = indexed.map(function(val) {
            switch(typeof val) {
                case "string":
                    return SortableTypeEnum.string;
                case "number":
                    return SortableTypeEnum.number;
                case "boolean":
                    return SortableTypeEnum.boolean;
                default:
                    throw new Error("Invalid type found in index");
            }
        }); */
    }

    private GetObjectById(id: string) {
        return this._idToSortableMap.get(id);
        /* var valueMap = this.indexMap.get("_id");
        if(valueMap === undefined)
            return undefined;

        var idMap = valueMap.get(id);
        if(idMap === undefined)
            return undefined;

        return idMap.get(id); */
    }
    
    private AddToIndex(object: T) {
        this._pathToTypeToIdsArray.forEach((valueToIdMap, propertyPath) => {
            const propertyValue = GetValue(object, propertyPath);
            let idArray = valueToIdMap.get(propertyValue);
            if(idArray === undefined) {
                idArray = new Set();
                valueToIdMap.set(propertyValue, idArray);
            }

            idArray.add(object._id);
        });

        this._idToSortableMap.set(object._id, this.GetSortable(object));
        /* this.indexMap.forEach((index, key) => {
            var objectValue = GetValue(object, key);
            var idMap = index.get(objectValue);
            if(idMap === undefined) {
                idMap = new Map();
                index.set(objectValue, idMap);
            }

            idMap.set(object._id, this.GetSortable(object));
        }); */
    }

    /* private GetIndexedValueMap(property: string, value: any | undefined) {
        if(value === undefined)
            return new Map<string, any[][]>();
        
        var valueMap = this.indexMap.get(property);
        return valueMap?.get(value) || new Map<string, any[][]>();
    } */

    private GetIndexedValueSet(propertyPath: string, value: SortableType) {
        return this._pathToTypeToIdsArray.get(propertyPath)?.get(value) || new Set();
    }

    private* AllValues() {
        for(const sortable of this._idToSortableMap.values())
            yield sortable;

        /* var valueMap = this.indexMap.get("_id");
        if(valueMap === undefined)
            return;
        
        for(var map of valueMap.values())
            for(var value of map.values())
                yield value; */
    }

    private GetSortable(object: T) {
        var sortable = this.paths.map(function(path) {
            return GetValue(object, path);
        });
        this.ModifySortable(sortable);
        return sortable;
    }

    private ModifySortable(sortable: any[]) {
        this.UpdateTypesArray(sortable);
        for(var x=0; x<sortable.length; x++) {
            if(this.types[x] === SortableTypeEnum.string)
                sortable[x] = (sortable[x] as string).toLowerCase();
        }
    }

    private async EnsureIndex(props: Array<string>) {
        const properties = [...new Set(props)];
        if(this.ensuringIndex !== null)
            await this.ensuringIndex;

        var missingProperties: string[] = [];
        for(var x=0; x<properties.length; x++)
            if(!Object.hasOwn(this._pathToSortableIndex, properties[x]))
            // if(!this.indexMap.has(properties[x]))
                missingProperties.push(properties[x]);

        if(missingProperties.length > 0) {
            const existingCount = Object.keys(this._pathToSortableIndex).length;
            for(var x=0; x<missingProperties.length; x++) {
                this._pathToSortableIndex[missingProperties[x]] = x + existingCount;
                this._pathToTypeToIdsArray.set(missingProperties[x], new Map());
                /* this.indexMap.set(missingProperties[x], new Map());
                this.paths.push(missingProperties[x]); */
            }

            await this.RebuildIndex();
        }
    }

    private async RebuildIndex() {
        await this.buildIndex(this);
    }

}