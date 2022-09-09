export enum SortableTypeEnum {
    boolean,
    number,
    string
}

export type RecursiveSort<T> = {
    [P in keyof T]?: 
        T[P] extends object ? RecursiveSort<T[P]> : "ASC" | "DESC";
};

export type SortableType = string | number | boolean;
export type Sortable = SortableType[];

export function QuickSort(sortables: Sortable[], types: SortableTypeEnum[], indexes: number[], dirs: number[]) {
    sortables.sort(function(a, b) {
        return Compare(a, b, types, indexes, dirs);
    });
    // SortPartition(sortables, types, indexes, dirs, 0, sortables.length - 1);
}

function CompareStrings(a: string, b: string, dir: number) {
    return a < b ? -1*dir : a === b ? 0 : 1*dir;
}

function CompareNumbers(a: number, b: number, dir: number) {
    return (a - b) * dir;
}

function CompareBooleans(a: boolean, b: boolean, dir: number) {
    return CompareNumbers(a ? 1 : 0, b ? 1 : 0, dir);
}

function Compare(a: Sortable, b: Sortable, types: SortableTypeEnum[], indexes: number[], dirs: number[]) {
    for(var x=0; x<indexes.length; x++) {
        var index = indexes[x];
        if(a[index] !== b[index])
            switch(types[index]) {
                case SortableTypeEnum.string:
                    return CompareStrings(a[index] as string, b[index] as string, dirs[x]);
                case SortableTypeEnum.number:
                    return CompareNumbers(a[index] as number, b[index] as number, dirs[x]);
                case SortableTypeEnum.boolean:
                    return CompareBooleans(a[index] as boolean, b[index] as boolean, dirs[x]);
            }
    }

    return 0;
}

/* function SortPartition(data: Sortable[], types: SortableTypeEnum[], indexes: number[], dirs: number[], low: number, high: number) {
    if(low < high) {
        var pivotIndex = Partition(data, types, indexes, dirs, low, high);
        SortPartition(data, types, indexes, dirs, low, pivotIndex - 1);
        SortPartition(data, types, indexes, dirs, pivotIndex + 1, high);
    }
}

function Partition(data: Sortable[], types: SortableTypeEnum[], indexes: number[], dirs: number[], low: number, high: number) {
    var pivotValue = data[high];
    var start = low;
    var temp: Sortable;
    for(var x=low; x<high; x++)
        if(Compare(data[x], pivotValue, types, indexes, dirs) < 0) {
            temp = data[start];
            data[start] = data[x];
            data[x] = temp;
            start++;
        }

    temp = data[start];
    data[start] = data[high];
    data[high] = temp;

    return start;
} */
