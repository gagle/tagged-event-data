# tagged-event-proxy

[![Build Status](https://travis-ci.org/gagle/tagged-event-proxy.svg?branch=master)](https://travis-ci.org/gagle/tagged-event-proxy)
[![Coverage Status](https://coveralls.io/repos/github/gagle/tagged-event-proxy/badge.svg?branch=master)](https://coveralls.io/github/gagle/tagged-event-proxy?branch=master)

```bash
$ npm install tagged-event-proxy 
```

At some point an app need to generate events. With this module you can emit events with a normalized json structure so it's easy to consume them using a flexible function signature that can adapt to your needs. With the ability to add metadata to the event's data, we ensure that the event is always fully descriptive.

A logging system may be implemented on top of this utility, like [Hapi event logs](https://hapijs.com/tutorials/logging). Tagged events are far more expressive, standard and useful than simple log lines.

```typescript
import { EventEmitter } from 'events';
import { createEventProxy, Event, interfaces } from 'tagged-event-proxy';

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
  (event: Event, tags: interfaces.StringKeyedObject<boolean>) => {
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

The reason why the event proxy does not inherit from an `EventEmitter` is to ease the event forwarding to a single `EventEmitter`, you decide where you want to attach the event proxy. Typically you have multiple event origins, for instance server events and request-specific events. Maybe you want to send metrics to a backend or you want to track any kind of business event. By decoupling the emission of the events you can create a single `EventEmitter` that will receive all kind of events, you can centralize all your application events.

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
  data?: StringKeyedObject<any>;
}
```

Returns a function that is able to emit events. Child event emitters can be created that will inherit and merge the default tags and data of the parent.

```typeScript
interface EventProxyChildOptions {
  tags?: string[];
  data?: StringKeyedObject<any>;
}

type EventTags = string[] | EventData;
type EventData = Error | StringKeyedObject<any> |
  (() => Promise<StringKeyedObject<any>>) | EventMessage;
type EventMessage = string | EventTimestamp;
type EventTimestamp = Date;

interface EventProxy {
  (tags: EventTags, data?: EventData, message?: EventMessage,
    timestamp?: EventTimestamp): void;
  tags: string[];
  data: StringKeyedObject<any>;
  child: (options: EventProxyChildOptions) => EventProxy;
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

### normalizeEvent(tags?: EventTags, data?: EventData, message?: EventMessage, timestamp?: EventTimestamp) : Promise\<Event\>

```typescript
type EventTags = string[] | EventData;
type EventData = Error | StringKeyedObject<any> |
  (() => Promise<StringKeyedObject<any>>) | EventMessage;
type EventMessage = string | EventTimestamp;
type EventTimestamp = Date;
```

The function that normalizes the event calls.

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
