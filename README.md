# Schema

### Example
```js
const Phone = new Schema({
    areaCode: String,
    number: String,
    extension: String,
});

const Name  = new Schema({
    firstName: String,
    middleName: String,
    lastName: String,
});

const Contact = new Schema({
    emails: [ { tag: String, email: String } ],
    phones: [ { tag: String, phone: new Union(String, Phone) } ],
})

const Party = new Schema({
    // _id: String,
    nickname: String,
    names: {
        legal: Name,
        prefered: Name,
        foreign: [ { tag: String, name: Name } ],
    },
    contact: Contact,

    tags: [String],

    extensions: Object,
});
```

To validate an object, just simply run
```js
Party.validate(party);
```