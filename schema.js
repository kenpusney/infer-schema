function validate(schema, value, strict = false,  key = undefined) {
    if (value === undefined) {
        if (strict || schema instanceof Bottom) {
            throw new TypeError(`undefined value for ${key}: ${schema}`)
        } else {
            return;
        }
    }
    if (schema === null) {
        if (value !== null) {
            throw new TypeError("Object is not a null value");
        }
    }
    if (schema instanceof Schema) {
        schema.validate(value);
    } else if (schema instanceof Function) {
        if ([String, Number, Boolean].includes(schema)) {
            if (typeof value != schema.name.toLowerCase()) {
                throw new TypeError(`value {${value}} of ${key} is not type of {${schema.name}}`);
            }
        }
    } else if (schema instanceof Array) {
        if (!(value instanceof Array)) {
            throw new TypeError(`value {${value}} of ${key} is not an array`);
        } else {
            value.forEach(e => {
                validate(schema[0], e);
            })
        }
    } else if (schema instanceof Object) {
        if (!(value instanceof Object)) {
            throw new TypeError(`value {${value}} of key ${key} is not an object`)
        }
        Object.keys(schema).forEach(key => {
            const subSchema = schema[key];
            const subValue = value[key];
            return validate(subSchema, subValue, strict, key);
        })
    }
}

function declval(schema) {
    if (schema === null || schema === undefined) {
        return schema;
    }
    if (schema instanceof Schema) {
        return schema.declval();
    }
    
    if (schema instanceof Function) {
        if ([String, Number, Boolean].includes(schema)) {
            switch(schema.name.toLowerCase()) {
                case "string": return "";
                case "number": return 0;
                case "boolean": return false;
            }
        }
    }

    if (schema instanceof Array) {
        return [];
    }
    
    if (schema instanceof Object) {
        const value = Object.create({});
        Object.keys(schema).forEach((key) => {
            const subSchema = schema[key];
            value[key] = declval(subSchema);
        });
        return value;
    }
}

class Schema {
    constructor(schema, { declval, validate } = {}) {
        this.schema = schema;
        this.options = { declval, validate };
    }

    validate(object, strict = false) {
        validate(this.schema, object, strict);

        if (this.options.validate) {
            if (!this.options.validate(object)) {
                throw new TypeError("Customized validator throws an error");
            }
        }
    }

    declval() {
        if (this.options.declval) {
            return this.options.declval();
        }
        return declval(this.schema);
    }

    static union(...types) {
        return new Union(...types);
    }
}

class Bottom extends Schema {
    constructor() {
        super(null);
    }

    validate(object, strict = false) {
        throw new TypeError("Bottom!");
    }

    declval() {
        throw new TypeError("Bottom!");
    }
}

class Any extends Schema {
    constructor() {
        super(null);
    }

    validate(object, strict = false) {
        if (object === undefined && strict) {
            throw new TypeError("undefined value is not allowed in strict mode for `any` type");
        }
    }

    declval() {
        return null;
    }
}

class Union extends Schema {
    constructor(...types) {
        super(types)
        this.types = types;
    }

    validate(object, strict = false) {
        const resultList =  this.types.map((schema) => {
            try {
                validate(schema, object, strict);
            } catch (e) {
                return e;
            }
            return true;
        })
        const result = resultList.some(x => x === true);
        if (!result) {
            throw new TypeError(`value {${object}} cannot match union schema ${this.schema}, errors: [${resultList}]`);
        }
    }

    declval() {
        return declval(this.types[0]);
    }
}

class Nullable extends Union {

    constructor(...types) {
        super(null, ...types);
    }
}

module.exports = {
    Schema, Union, Nullable, Any, Bottom
}
