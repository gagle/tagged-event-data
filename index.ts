import { EventEmitter } from 'events';
import { Event, createEventProxy, interfaces } from './src';

const emitter = new EventEmitter();
emitter.on('test', (
  event: Event,
  tags: interfaces.StringKeyedObject<boolean>) => {
  console.log(event);
});
const test = createEventProxy({
  emitter,
  name: 'test',
  tags: ['foo'],
  data: {
    hello: 'world'
  }
});

test('hi!');
