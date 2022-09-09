import { Inherit, Schema, SchemaType } from "./schema";

const testSchema = {
    _id: Schema.String,
    prop: Schema.Boolean
}

const TestSchema = Schema.ToFunction(testSchema);
type tType = SchemaType<typeof TestSchema>;

const subSchema = Inherit(testSchema, {
    secondProp: Schema.Number
});

const SubSchema = Schema.ToFunction(subSchema);
type sType = SchemaType<typeof SubSchema>;

