
const { Schema, Union, Nullable, Any, Bottom } = require("./schema")

class AssertionError extends Error {
    constructor(message = "Assertion error!") {
        super(message);
    }
}

function assert(cond, message) {
    if (!cond) {
        throw new AssertionError(message);
    }
}

function assertThrows(action, ex = Error) {
    try {
        action()
    } catch (e) {
        assert(e instanceof ex);
        return;
    }
    assert(false, `Expected exception ${ex} unmet`);
}


(function testSchema() {
    
    const simpleNumber = new Schema(Number);
    simpleNumber.validate(1);
    assertThrows(() => simpleNumber.validate("abc"), TypeError);


    const simpleString = new Schema(String);
    simpleString.validate("abc");
    assertThrows(() => simpleString.validate(123), TypeError);

    const simpleBoolean = new Schema(Boolean);
    simpleBoolean.validate(true);
    assertThrows(() => simpleBoolean.validate(123), TypeError);

    const simpleArray = new Schema([Number])
    simpleArray.validate([]);
    simpleArray.validate([1]);
    simpleArray.validate([1,2,3]);
    assertThrows(() => simpleArray.validate(1), TypeError);
    assertThrows(() => simpleArray.validate("1"), TypeError);
    assertThrows(() => simpleArray.validate({}), TypeError);

    const simpleObject = new Schema({ name: String });
    simpleObject.validate({});
    simpleObject.validate({name: undefined});
    assertThrows(() => simpleObject.validate({name: null}), TypeError);
    assertThrows(() => simpleObject.validate({name: undefined}, true), TypeError);

    const simpleUnion = new Schema(new Union(Number, String)); // or new Schema(Schema.union(...));
    simpleUnion.validate(1);
    simpleUnion.validate("abc");
    simpleUnion.validate(undefined);
    assertThrows(() => simpleUnion(true), TypeError);

    const simpleNull = new Schema(null);
    simpleNull.validate(null);
    simpleNull.validate(undefined);
    assertThrows(() => simpleNull.validate(123), TypeError);
    assertThrows(() => simpleNull.validate(undefined, true), TypeError);

    const simpleNullable = new Schema(new Nullable(Number))
    simpleNullable.validate(null);
    simpleNullable.validate(undefined);
    simpleNullable.validate(123);
    assertThrows(() => simpleNullable.validate("abc"), TypeError);
    assertThrows(() => simpleNullable.validate(undefined, true), TypeError);

    const simpleAny = new Schema(new Any());

    simpleAny.validate(null);
    simpleAny.validate(123);
    simpleAny.validate(undefined);
    simpleAny.validate("abc");
    simpleAny.validate({});
    simpleAny.validate([])
    assertThrows(() => simpleAny.validate(undefined, true), TypeError);

    const simpleBottom = new Schema(new Bottom());

    assertThrows(() => simpleBottom.validate(1), TypeError);
    assertThrows(() => simpleBottom.validate(true), TypeError);
    assertThrows(() => simpleBottom.validate(false), TypeError);
    assertThrows(() => simpleBottom.validate("abc"), TypeError);
    assertThrows(() => simpleBottom.validate(null), TypeError);
    assertThrows(() => simpleBottom.validate({}), TypeError);
    assertThrows(() => simpleBottom.validate([]), TypeError);
    assertThrows(() => simpleBottom.validate(undefined), TypeError);

    
    const simpleCustomize = new Schema(Boolean, { validate: (x) => !x });
    simpleCustomize.validate(false);
    assertThrows(() => simpleCustomize.validate(true), TypeError);

    const simpleMobileValidator = new Schema(String, { validate: (s) => /^1\d{10}$/.test(s) } );

    () => simpleMobileValidator.validate("13688888888");
    assertThrows(() => simpleMobileValidator.validate("1234567890"), TypeError);
    assertThrows(() => simpleMobileValidator.validate("02899999999"), TypeError);
    assertThrows(() => simpleMobileValidator.validate(13888888888), TypeError);
})();

(function testDeclVal() {

    assert(new Schema(Number).declval() === 0);
    assert(new Schema(Boolean).declval() === false);
    assert(new Schema(String).declval() === "");
    assert(new Schema(null).declval() === null);
    assert(new Schema(undefined).declval() === undefined);

    const simpleObject = new Schema({ a: Number, b: { c: String, d: null } }).declval()
    assert(simpleObject.a === 0);
    assert(simpleObject.b.c === "");
    assert(simpleObject.b.d === null);

    assert(new Schema([Number]).declval().length === 0);

    assert(new Schema(new Union(Number, String)).declval() === 0);

    assert(new Schema(new Any()).declval() === null);
    assert(new Schema(new Nullable(Number)).declval() === null);

    assert(new Schema(Number, { declval: () => 1}).declval() === 1)
})();