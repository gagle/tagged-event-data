import { EventEmitter } from 'events';
import { createEventProxy, Event, interfaces } from './src';

const emitter = new EventEmitter();
const event1 = createEventProxy({
  emitter,
  name: 'log',
  tags: ['tag1'],
  data: {
    n: 1
  }
});
const event2 = event1.child({
  tags: ['tag2']
});
const event3 = event2.child({
  tags: ['tag3'],
  data: {
    n: 3
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

  /*
  { test: true, info: true }
  */
});

event1()
event2()
event3()
