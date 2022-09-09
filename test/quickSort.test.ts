import { QuickSort, SortableTypeEnum } from "../src/Utils/quickSort";

test("Sorting Numbers", () => {
    var arr = [[3], [2], [1], [4]];
    QuickSort(arr, [SortableTypeEnum.number], [0], [1]);
    expect(arr[0][0]).toBe(1);
});

/* test("Sorting a lot of numbers", () => {
    var arr: number[] = [];
    for(var x=0; x<10000; x++)
        arr.push(Math.random());

    var arr1 = arr.slice();
    var arr2 = arr.slice();

    var s = Date.now();
    arr1.sort(CompareNumbers);
    var e = Date.now();

    var s1 = Date.now();
    QuickSort(arr2, CompareNumbers);
    var e1 = Date.now();

    for(var x=0; x<arr.length; x++)
        expect(arr1[x]).toBe(arr2[x]);

    console.log(`Standard sort took ${e - s}ms, custom sort took ${e1 - s1}ms for ${arr.length} items`);
}); */

/* test("Buffer sizes", () => {

    var buffer = Buffer.from([123456]);
    expect(buffer[0]).toBe(123456);
}); */