function sum(a: number, b: number) {
    return a + b;
}

test("Sample", () => {
    expect(sum(2, 3)).toBe(5);
});

/* test("Buffer sizes", () => {

    var buffer = Buffer.from([123456]);
    expect(buffer[0]).toBe(123456);
}); */