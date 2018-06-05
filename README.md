# events-extra
NodeJS EventEmitter with some advanced features

[![npm](https://img.shields.io/npm/v/events-extra.svg)](https://www.npmjs.com/package/events-extra)
[![Build Status](https://travis-ci.org/tormozz48/events-extra.svg?branch=master)](https://travis-ci.org/tormozz48/events-extra)
[![Coverage Status](https://coveralls.io/repos/github/tormozz48/events-extra/badge.svg?branch=master)](https://coveralls.io/github/tormozz48/events-extra?branch=master)
[![Dependency Status](https://david-dm.org/tormozz48/events-extra.svg)](https://david-dm.org/tormozz48/events-extra)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![license](https://img.shields.io/github/license/tormozz48/events-extra.svg)](https://github.com/tormozz48/events-extra/blob/master/LICENSE)

```
You were my oppressor
And I, I have been programmed to obey
But now you are my handler
And I, I will execute your demands

Muse
```

## Install

Add package into your project:
* via npm: `npm install --save events-extra`
* via yarn: `yarn add event-extra`

## Usage

Include package into your sourse code.
```js
const EventsExtra = require('events-extra');
```
or even:
```js
import EventsExtra from 'events-extra';
```

`EventsExtra` - is sub-class of NodeJS EventEmitter class and inherits all
properties and methods of original class.

But it also add some advanced instance methods:

* `emitAndWait`
* `passthroughEvent`

and static class methods:
* `passthroughEvent`
* `passthroughEventAsync`

#### emitAndWait

Emits event and wait for fullfilled or rejected promises returned by all listener handlers.
Returns array of resolved values if all handlers returns fullfilled promises, or rejection
reason of first rejected handler.

Example:
```js
const EventsExtra = require('events-extra');

const myEmitter = new EventsExtra();

myEmitter.on('foo', (data) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('Hello ' + data);
        }, 1000)
    });
});

myEmitter.emitAndWait('foo', 'World')
    .then((result) => {
        console.log(result); // ['Hello World']
    });
```

#### passthroughEvent

Appends listener to given emitter for given events, handles these events and triggers them itself.

Example:
```js
const EventsExtra = require('events-extra');

const sourceEmitter = new EventsExtra();
const destEmitter = new EventsExtra();

destEmitter.passthroughEvent(sourceEmitter, 'foo');

destEmitter.on('foo', (data) => {
    console.log('Hello ' + data);
});

sourceEmitter.emit('foo', 'World');
```

`passthroughEvent` - also works with async events. Use `emitAndWait` istead of `emit` for triggering initial event on source emitter.

Example:

```js
const EventsExtra = require('events-extra');

const sourceEmitter = new EventsExtra();
const destEmitter = new EventsExtra();

destEmitter.passthroughEvent(sourceEmitter, 'foo');

destEmitter.on('foo', (data) => {
    return Promise.resove('Hello ' + data);
});

sourceEmitter.emitAndWait('foo', 'World')
    .then((res) => {
        console.log(res); // [['Hello World']]
    });
```


#### passthroughEvent (class method)

Static method for passthough event(s) from one event emitter to another.

Example:
```js
const EventsExtra = require('events-extra');

const sourceEmitter = new EventsExtra();
const destEmitter = new EventsExtra();

EventsExtra.passthroughEvent(sourceEmitter, destEmitter, ['foo', 'bar']);

destEmitter.on('foo', (data) => {
    console.log('Hello ' + data);
});

destEmitter.on('bar', (data) => {
    console.log('Goodbye ' + data);
});

sourceEmitter.emit('foo', 'World'); // Hello World
sourceEmitter.emit('bar', 'World'); // Goodbye World
```

#### passthroughEventAsync (class method)

Same as `passthroughEvent` but for async event handling.

## Acknowledgement

This code is separate implementation of `EventEmitter` subclasses
taken from:

* [gemini-core](https://github.com/gemini-testing/gemini-core),
* [gemini](https://github.com/gemini-testing/gemini)
* [hermione](https://github.com/gemini-testing/hermione)

repositories and different plugins for these tools.

Special thanks to:

* Sergey Tatarintsev [SevInf](https://github.com/SevInf)
* Eugene Konstantinov [sipayRT](https://github.com/sipayRT)
* Dmitriy Dudkevich [DudaGod](https://github.com/DudaGod)
* Anton Usmansky [j0tunn](https://github.com/j0tunn)
* Rostislav Shtanko [rostik404](https://github.com/rostik404)
* Evgeniy Gavryushin [eGavr](https://github.com/eGavr)



