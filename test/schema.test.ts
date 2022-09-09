import { Schema, SchemaType } from "../src/Schema/schema";

const subChildSchema = {
    subProp: Schema.String
};

const SubChildSchema = Schema.ToFunction(subChildSchema);

const childSchema1 = {
    childProp: Schema.Number,
    subChild: SubChildSchema
};

const ChildSchema1 = Schema.ToFunction(childSchema1);

const schema1 = {
    prop1: Schema.String,
    prop2: Schema.Boolean,
    child: ChildSchema1
};

const Schema1 = Schema.ToFunction(schema1);

test("Default schema", () => {
    var init = Schema1({});
    expect(init.prop1).toBe("");
    expect(init.prop2).toBe(false);
    expect(init.child).toBeTruthy();
    expect(init.child.childProp);
    expect(init.child.subChild.subProp).toBe("");
});

/* test("Buffer sizes", () => {

    var buffer = Buffer.from([123456]);
    expect(buffer[0]).toBe(123456);
}); */