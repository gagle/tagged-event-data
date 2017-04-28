import { EventEmitter } from 'events';
import { expect } from 'chai';
import assertEventSchema from '../utils/assertEventSchema';
import {
  assertDefaultTags,
  assertDefaultData,
  assertDefaultMessage,
  assertDefaultTimestamp
} from '../utils/defaults';
import { createEventProxy, Event, EventProxy, interfaces } from '../../src';

describe('createEventProxy()', () => {
  let emitter: EventEmitter;

  const createEvent = (options: {
    [key: string]: any
  } = {}): EventProxy =>
    createEventProxy(Object.assign({
      emitter,
      name: 'event-name'
    }, options));

  const emitEvent = (eventProxy: EventProxy, ...eventArguments: any[]) =>
    new Promise<{
      event: Event,
      tags: interfaces.StringKeyedObject<boolean>
    }>((resolve, reject) => {
      emitter
        .on('error', reject)
        .on('event-name', (
          event: Event,
          tags: interfaces.StringKeyedObject<boolean>
        ) => {
          resolve({
            event,
            tags
          });
        });
      (eventProxy as any)(...eventArguments);
    }
  );

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  it('creates a function which when called emits the normalized event along \
with the tags array converted to a <tag>:true hash object', async () => {
    const eventProxy = createEvent();

    const {
      event,
      tags
    } = await emitEvent(eventProxy, ['a'], 'b');

    assertEventSchema(event);
    expect(event.message).to.equal('b');
    expect(tags).to.deep.equal({
      a: true
    });
  });

  it('emits empty hash object when no tags are passed', async () => {
    const eventProxy = createEvent();

    const {
      event,
      tags
    } = await emitEvent(eventProxy, 'a');

    assertEventSchema(event);
    expect(event.message).to.equal('a');
    expect(tags).to.be.an('object').and.to.be.empty;
  });

  it('can be configured with default data that is merged with provided data',
    async () => {
    const eventProxy = createEvent({
      data: {
        a: 'b'
      }
    });

    const {
      event
    } = await emitEvent(eventProxy, { b: 'c' });

    assertEventSchema(event);
    expect(event.data).to.deep.equal({
      a: 'b',
      b: 'c'
    });
  });

  it('provided data replaces default data when merging conflicts', async () => {
    const eventProxy = createEvent({
      data: {
        a: 'b'
      }
    });

    const {
      event
    } = await emitEvent(eventProxy, { a: 'c' });

    assertEventSchema(event);
    expect(event.data).to.deep.equal({
      a: 'c'
    });
  });

  it('deep merges default and provided data', async () => {
    const eventProxy = createEvent({
      data: {
        a: {
          b: {
            c: 'd',
            x: 'y'
          }
        }
      }
    });

    const {
      event
    } = await emitEvent(eventProxy, {
        a: {
          b: {
            c: 'e',
            e: 'f'
          }
        }
      });

    assertEventSchema(event);
    expect(event.data).to.deep.equal({
        a: {
          b: {
            c: 'e',
            e: 'f',
            x: 'y'
          }
        }
      });
  });

  it('can be configured with default tags that are merged with provided tags',
    async () => {
    const eventProxy = createEvent({
      tags: ['a']
    });

    const {
      event
    } = await emitEvent(eventProxy, ['b']);

    assertEventSchema(event);
    expect(event.tags).to.deep.equal(['a', 'b']);
  });

  it('duplicate and empty string tags are removed', async () => {
    const eventProxy = createEvent({
      tags: ['a', 'a', '']
    });

    const {
      event
    } = await emitEvent(eventProxy, ['a', 'b', '']);

    assertEventSchema(event);
    expect(event.tags).to.deep.equal(['a', 'b']);
  });

  it('can create child event proxies that \'inherit\' default data and tags \
from parent', async () => {
    const eventProxy = createEvent({
      data: {
        a: 'b'
      },
      tags: ['a']
    }).child();

    const {
      event
    } = await emitEvent(eventProxy);

    assertEventSchema(event);
    expect(event.tags).to.deep.equal(['a']);
    expect(event.data).to.deep.equal({
      a: 'b'
    });
  });

  it('child event proxies data and tags are merged with parent\'s data and \
tags', async () => {
    const eventProxy = createEvent({
      data: {
        a: 'b'
      },
      tags: ['a']
    }).child({
      data: {
        b: 'c'
      },
      tags: ['b']
    });

    const {
      event
    } = await emitEvent(eventProxy, ['c'], {
      c: 'd'
    });

    assertEventSchema(event);
    expect(event.tags).to.deep.equal(['a', 'b', 'c']);
    expect(event.data).to.deep.equal({
      a: 'b',
      b: 'c',
      c: 'd'
    });
  });

  it('parent and child are independent event proxies', async () => {
    const parentEventProxy = createEvent({
      tags: ['a']
    });
    const childEventProxy = parentEventProxy.child({
      tags: ['b']
    });

    expect(parentEventProxy).to.not.equal(childEventProxy);
  });

  it('child event proxies can also create childs', async () => {
    const eventProxy = createEvent({
      tags: ['a']
    }).child({
      tags: ['b']
    }).child({
      tags: ['c']
    });

    const {
      event
    } = await emitEvent(eventProxy, ['d']);

    assertEventSchema(event);
    expect(event.tags).to.deep.equal(['a', 'b', 'c', 'd']);
  });

  it('errors in the sync/async data function are emitted', async () => {
    const eventProxy = createEvent();

    const err = await new Promise(async (resolve, reject) => {
      try {
        await emitEvent(eventProxy, () => {
          throw new Error();
        });
        reject(new Error('should fail with an error'));
      } catch (err) {
        resolve(err);
      }
    });

    expect(err).to.be.an('error');
  });

  it('default tags and data are exposed and can be modified', async () => {
    const eventProxy = createEvent({
      tags: ['a'],
      data: {
        a: 'b'
      }
    });
    eventProxy.tags.push('b');
    eventProxy.data.b = 'c';

    const {
      event
    } = await emitEvent(eventProxy, ['c'], {
      c: 'd'
    });

    assertEventSchema(event);
    expect(event.tags).to.deep.equal(['a', 'b', 'c']);
    expect(event.data).to.deep.equal({
      a: 'b',
      b: 'c',
      c: 'd'
    });
  });

  it('accepts empty arguments', async () => {
    const eventProxy = createEvent();

    const {
      event
    } = await emitEvent(eventProxy);

    assertEventSchema(event);
    assertDefaultTags(event);
    assertDefaultData(event);
    assertDefaultMessage(event);
    assertDefaultTimestamp(event);
  });

  it('event instances are reused when multiple event emitters are attached',
    async () => {
    const emitter1 = new EventEmitter();
    const emitter2 = new EventEmitter();
    const eventProxy = createEventProxy({
      emitter: [emitter1, emitter2],
      name: 'event-name'
    });

    const promises = [
      new Promise<{
        event: Event,
        tags: interfaces.StringKeyedObject<boolean>
      }>((resolve, reject) => {
        emitter1
          .on('error', reject)
          .on('event-name', (
            event: Event,
            tags: interfaces.StringKeyedObject<boolean>
          ) => {
            resolve({
              event,
              tags
            });
          });
      }),
      new Promise<{
        event: Event,
        tags: interfaces.StringKeyedObject<boolean>
      }>((resolve, reject) => {
        emitter2
          .on('error', reject)
          .on('event-name', (
            event: Event,
            tags: interfaces.StringKeyedObject<boolean>
          ) => {
            resolve({
              event,
              tags
            });
          });
      })
    ];

    eventProxy();

    const results = await Promise.all(promises);

    expect(results[0].event).to.be.equal(results[1].event);
    expect(results[0].tags).to.be.equal(results[1].tags);
  });

  it('error instances are reused when multiple event emitters are attached',
    async () => {
    const emitter1 = new EventEmitter();
    const emitter2 = new EventEmitter();
    const eventProxy = createEventProxy({
      emitter: [emitter1, emitter2],
      name: 'event-name'
    });
    const promises = [
      new Promise<Error>((resolve, reject) => {
        emitter1
          .on('error', (err: Error) => {
            resolve(err);
          })
          .on('event-name', (
            event: Event,
            tags: interfaces.StringKeyedObject<boolean>
          ) => {
            reject(new Error('should fail with an error'));
          });
      }),
      new Promise<Error>((resolve, reject) => {
        emitter2
          .on('error', (err: Error) => {
            resolve(err);
          })
          .on('event-name', (
            event: Event,
            tags: interfaces.StringKeyedObject<boolean>
          ) => {
            reject(new Error('should fail with an error'));
          });
      })
    ];

    eventProxy(() => {
      throw new Error();
    });

    const results = await Promise.all(promises);

    expect(results[0]).to.be.equal(results[1]);
  });
});
