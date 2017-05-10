# tagged-event-proxy

[![Build Status](https://travis-ci.org/gagle/tagged-event-proxy.svg?branch=master)](https://travis-ci.org/gagle/tagged-event-proxy)
[![Coverage Status](https://coveralls.io/repos/github/gagle/tagged-event-proxy/badge.svg?branch=master)](https://coveralls.io/github/gagle/tagged-event-proxy?branch=master)
[![David](https://img.shields.io/david/gagle/tagged-event-proxy.svg)](https://david-dm.org/gagle/tagged-event-proxy)
[![npm](https://img.shields.io/npm/dm/tagged-event-proxy.svg)](https://www.npmjs.com/package/tagged-event-proxy)

```bash
$ npm install tagged-event-proxy
```

At some point an app needs to generate events. With this module you can emit events with a consistent json schema to consume them easily using a flexible function signature that can adapt to your needs. With the ability to add metadata to the event the event is always fully-descriptive.

A logging system may be implemented on top of this utility, like [Hapi event logs](https://hapijs.com/tutorials/logging). Tagged events are far more expressive, standard and useful than simple log lines.

```typescript
import { EventEmitter } from 'events';
import { createEventProxy, Event, EventTagsMap } from 'tagged-event-proxy';

const emitter = new EventEmitter();
const newEvent = createEventProxy({
  emitter,
  name: 'log',
  tags: ['test'],
  data: {
    foo: 'bar'
  }
});

emitter.on('log',
  (event: Event, tags: EventTagsMap) => {
  console.log(event);
  /*
  { tags: [ 'test', 'info' ],
  message: 'hello world',
  data: { id: 1 },
  timestamp: 2017-04-24T13:11:17.089Z }
  */
  
  console.log(tags);
  /*
  { test: true, info: true }
  */
});

newEvent(['info'], 'hello world');
```

The reason why the event proxy does not inherit from an `EventEmitter` is to ease the event forwarding to a single `EventEmitter`, you decide where you want to attach the event proxy. Typically you have multiple event origins, for instance server events and request-specific events. Maybe you want to send metrics or you want to track any kind of business event. By decoupling the emission of the events you can create a single `EventEmitter` that will receive all kind of events, you can centralize all your application events.

### createEventProxy(options: CreateEventProxyOptions): EventProxy

Options: 

- __emitter__ - _EventEmitter | EventEmitter[]_ `EventEmitter` or array of `EventEmitter` instances that will receive events with name `<name>` and `error`.
- __name__ _string_ Name of the event.
- __tags__ _string[] (optional)_ Default tags to include with the event.
- __data__ _object (optional)_ Default data to include with the event. The data must be a string-keyed object, eg. `{ foo: 'bar' }`.

```typeScript
interface CreateEventProxyOptions {
  emitter: EventEmitter | EventEmitter[];
  name: string;
  tags?: string[];
  data?: EventDataMap;
}
```

Returns a function that is able to emit events. Child event emitters can be created that will inherit and merge the default tags and data of the parent.

```typeScript
interface EventProxyChildOptions {
  tags?: string[];
  data?: EventDataMap;
}

type EventError = Error | EventTags;
type EventTags = string[] | EventData;
type EventData = EventDataMap | (() => Promise<EventDataMap>) |
  EventMessage;
type EventMessage = string | EventTimestamp;
type EventTimestamp = Date;

interface EventProxy {
  (error?: EventError, tags?: EventTags, data?: EventData,
    message?: EventMessage, timestamp?: EventTimestamp): void;
  tags: string[];
  data: EventDataMap;
  child: (options?: EventProxyChildOptions) => EventProxy;
}
```

There are a lot of ways to emit an event.

```typescript
const emitter = new EventEmitter();
const newEvent = createEventProxy({
  emitter,
  name: 'log',
  tags: ['tag1'],
  data: {
    foo: 'bar'
  }
});

newEvent(['tag2', 'tag3'], { bar: 'foo' }, 'message', new Date());
newEvent(['tag2', 'tag3'], 'message');
newEvent('message');
newEvent(['tag2', 'tag3'], { bar: 'foo' });
newEvent({ bar: 'foo' }, 'message');
newEvent();
```

The data parameter can be also a sync/async function, useful to provide a value by using a closure. Errors thrown from inside the function are catched and emitted as `error`.

```typescript
newEvent(() => ({ a: 'b'}));
newEvent(async () => ({ a: 'b'}));
```

Tags and data are accessible from outside just in case they need to be changed.

```typescript
console.log(newEvent.tags); // ['tag1']
console.log(newEvent.data); // { foo: 'bar' }
```

### normalizeEvent(error?: EventError, tags?: EventTags, data?: EventData, message?: EventMessage, timestamp?: EventTimestamp) : Promise\<Event\>

The function that normalizes the event calls. Takes the same parameters as the event proxy function.

## Childs

Event proxies can be also create more event proxies that reuse tags and data:

```typescript
const emitter = new EventEmitter();

const event1 = createEventProxy({
  emitter,
  name: 'log',
  tags: ['tag1'],
  data: {
    n: 1
  }
});
event1();
/*
{ tags: [ 'tag1' ],
  data: { n: 1 },
  message: '',
  timestamp: 2017-04-24T15:56:33.912Z }
*/

const event2 = event1.child({
  tags: ['tag2']
});
event2();
/*
{ tags: [ 'tag1', 'tag2' ],
  data: { n: 1 },
  message: '',
  timestamp: 2017-04-24T15:56:33.912Z }
*/

const event3 = event2.child({
  tags: ['tag3'],
  data: {
    n: 3
  }
});
event3();
/*
{ tags: [ 'tag1', 'tag2', 'tag3' ],
  data: { n: 3 },
  message: '',
  timestamp: 2017-04-24T15:56:33.913Z }
*/
```

## Errors

The first parameter of the event proxy function is an error. This allows you to easily track errors without caring about the other parameters because all of them are optional. A new `error` field is added to the event with this error.

```typescript
const emitter = new EventEmitter();
const newEvent = createEventProxy({
  emitter,
  name: 'log',
  tags: ['tag1']
});

try {
  throw new Error('whoops!');
} catch (err) {
  newEvent(err);
  /*
  { tags: [ 'tag1' ],
  data: {},
  message: '',
  timestamp: 2017-04-25T12:51:37.043Z,
  error:
   Error: whoops!
       at Object.<anonymous> ...
       ... }
  */
}
```

As you may know, any kind of data can be thrown using the `throw` keyword, this means that any potential unexpected type of parameter can be passed to the function. This situation is also controlled and any unexpected type is treated as an `Error`.

```typescript
try {
  throw 123;
} catch (err) {
  newEvent(err);
  /*
  { tags: [ 'tag1' ],
  data: {},
  message: '',
  timestamp: 2017-04-25T12:51:37.043Z,
  error:
   Error: unexpected parameter type: 123
       at Object.<anonymous> ...
       ... }
  */
}
```
