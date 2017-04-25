import { expect } from 'chai';
import { normalizeEvent, Event } from '../../src';
import assertEventSchema from '../utils/assertEventSchema';
import {
  assertDefaultTags,
  assertDefaultData,
  assertDefaultMessage,
  assertDefaultTimestamp
} from '../utils/defaults';

describe('normalizeEvent()', () => {
  const assertErrorSchema = (event: Event) => {
    expect(event).to.have.all.keys('tags', 'data', 'message', 'timestamp',
      'error');
    expect(event).to.have.property('error').that.is.an('error');
    expect(event).to.have.property('tags').that.is.an('array');
  };

  it('returns a promise', async () => {
    const promise = normalizeEvent();

    expect(promise).to.be.a('promise');
  });

  it('accepts empty arguments', async () => {
    const event = await normalizeEvent();

    assertEventSchema(event);
    assertDefaultTags(event);
    assertDefaultData(event);
    assertDefaultMessage(event);
    assertDefaultTimestamp(event);
  });

  it('accepts tags', async () => {
    const event = await normalizeEvent(['a', 'b']);

    assertEventSchema(event);
    expect(event.tags).to.deep.equal(['a', 'b']);
    assertDefaultData(event);
    assertDefaultMessage(event);
    assertDefaultTimestamp(event);
  });

  it('accepts data', async () => {
    const event = await normalizeEvent({ a: 'b' });

    assertEventSchema(event);
    assertDefaultTags(event);
    expect(event.data).to.deep.equal({ a: 'b' });
    assertDefaultMessage(event);
    assertDefaultTimestamp(event);
  });

  it('accepts message', async () => {
    const event = await normalizeEvent('a');

    assertEventSchema(event);
    assertDefaultTags(event);
    assertDefaultData(event);
    expect(event.message).to.equal('a');
    assertDefaultTimestamp(event);
  });

  it('accepts timestamp', async () => {
    const date = new Date();
    const event = await normalizeEvent(date);

    assertEventSchema(event);
    assertDefaultTags(event);
    assertDefaultData(event);
    assertDefaultMessage(event);
    expect(event.timestamp).to.equal(date);
  });

  it('accepts tags,data', async () => {
    const event = await normalizeEvent(['a', 'b'], { a: 'b' });

    assertEventSchema(event);
    expect(event.tags).to.deep.equal(['a', 'b']);
    expect(event.data).to.deep.equal({ a: 'b' });
    assertDefaultMessage(event);
    assertDefaultTimestamp(event);
  });

  it('accepts tags,message', async () => {
    const event = await normalizeEvent(['a', 'b'], 'a');

    assertEventSchema(event);
    expect(event.tags).to.deep.equal(['a', 'b']);
    assertDefaultData(event);
    expect(event.message).to.equal('a');
    assertDefaultTimestamp(event);
  });

  it('accepts tags,timestamp', async () => {
    const date = new Date();

    const event = await normalizeEvent(['a', 'b'], date);

    assertEventSchema(event);
    expect(event.tags).to.deep.equal(['a', 'b']);
    assertDefaultData(event);
    assertDefaultMessage(event);
    expect(event.timestamp).to.equal(date);
  });

  it('accepts tags,data,message', async () => {
    const event = await normalizeEvent(['a', 'b'], { a: 'b' }, 'a');

    assertEventSchema(event);
    expect(event.tags).to.deep.equal(['a', 'b']);
    expect(event.data).to.deep.equal({ a: 'b' });
    expect(event.message).to.equal('a');
    assertDefaultTimestamp(event);
  });

  it('accepts tags,data,timestamp', async () => {
    const date = new Date();
    const event = await normalizeEvent(['a', 'b'], { a: 'b' }, date);

    assertEventSchema(event);
    expect(event.tags).to.deep.equal(['a', 'b']);
    expect(event.data).to.deep.equal({ a: 'b' });
    assertDefaultMessage(event);
    expect(event.timestamp).to.equal(date);
  });

  it('accepts tags,data,message,timestamp', async () => {
    const date = new Date();
    const event = await normalizeEvent(['a', 'b'], { a: 'b' }, 'a', date);

    assertEventSchema(event);
    expect(event.tags).to.deep.equal(['a', 'b']);
    expect(event.data).to.deep.equal({ a: 'b' });
    expect(event.message).to.equal('a');
    expect(event.timestamp).equals(date);
  });

  it('accepts tags,message,timestamp', async () => {
    const date = new Date();
    const event = await normalizeEvent(['a', 'b'], 'a', date);

    assertEventSchema(event);
    expect(event.tags).to.deep.equal(['a', 'b']);
    assertDefaultData(event);
    expect(event.message).to.equal('a');
    expect(event.timestamp).equals(date);
  });

  it('accepts data,message', async () => {
    const event = await normalizeEvent({ a: 'b' }, 'a');

    assertEventSchema(event);
    assertDefaultTags(event);
    expect(event.data).to.deep.equal({ a: 'b' });
    expect(event.message).to.equal('a');
    assertDefaultTimestamp(event);
  });

  it('accepts data,timestamp', async () => {
    const date = new Date();
    const event = await normalizeEvent({ a: 'b' }, date);

    assertEventSchema(event);
    assertDefaultTags(event);
    expect(event.data).to.deep.equal({ a: 'b' });
    assertDefaultMessage(event);
    expect(event.timestamp).to.equal(date);
  });

  it('accepts data,message,timestamp', async () => {
    const date = new Date();
    const event = await normalizeEvent({ a: 'b' }, 'a', date);

    assertEventSchema(event);
    assertDefaultTags(event);
    expect(event.data).to.deep.equal({ a: 'b' });
    expect(event.message).to.equal('a');
    expect(event.timestamp).equals(date);
  });

  it('accepts message,timestamp', async () => {
    const date = new Date();
    const event = await normalizeEvent('a', date);

    assertEventSchema(event);
    assertDefaultTags(event);
    assertDefaultData(event);
    expect(event.message).to.equal('a');
    expect(event.timestamp).to.equal(date);
  });

  it('accepts any other type of data (try/catch) and is stored in the message \
field', async () => {
    let event;

    try {
      throw 123;
    } catch (err) {
      event = await normalizeEvent(err);
    }

    assertEventSchema(event);
    assertDefaultTags(event);
    assertDefaultData(event);
    expect(event.message).to.equal('123');
    assertDefaultTimestamp(event);

    try {
      throw 0;
    } catch (err) {
      event = await normalizeEvent(err);
    }

    assertEventSchema(event);
    assertDefaultTags(event);
    assertDefaultData(event);
    expect(event.message).to.equal('0');
    assertDefaultTimestamp(event);
  });

  it('data type can be also null', async () => {
    const event = await normalizeEvent(null);

    assertEventSchema(event);
    assertDefaultTags(event);
    expect(event.data).to.be.null;
    assertDefaultMessage(event);
    assertDefaultTimestamp(event);
  });

  it('data type can be also a sync/async function', async () => {
    let event;

    event = await normalizeEvent(() => ({ a: 'b'}));

    assertEventSchema(event);
    assertDefaultTags(event);
    expect(event.data).to.deep.equal({ a: 'b' });
    assertDefaultMessage(event);
    assertDefaultTimestamp(event);

    event = await normalizeEvent(async () => ({ a: 'b'}));

    assertEventSchema(event);
    assertDefaultTags(event);
    expect(event.data).to.deep.equal({ a: 'b' });
    assertDefaultMessage(event);
    assertDefaultTimestamp(event);
  });

  it('forwards the error when the sync/async data function throws',
    async () => {
    let err;

    err = await new Promise(async (resolve, reject) => {
      try {
         await normalizeEvent(() => {
          throw new Error();
        });
        reject(new Error('should fail with an error'));
      } catch (err) {
        resolve(err);
      }
    });

    expect(err).to.be.an('error');

    err = await new Promise(async (resolve, reject) => {
      try {
        await normalizeEvent(async () => {
          throw new Error();
        });
        reject(new Error('should fail with an error'));
      } catch (err) {
        resolve(err);
      }
    });

    expect(err).to.be.an('error');
  });

  it('accepts error', async () => {
    let err = new Error();
    let event = await normalizeEvent(err);

    assertErrorSchema(event);
    expect(event.error).to.be.equal(err);
    assertDefaultTags(event);
    assertDefaultData(event);
    assertDefaultMessage(event);
    assertDefaultTimestamp(event);

    err = new Error('a');
    event = await normalizeEvent(err);

    assertErrorSchema(event);
    expect(event.error).to.be.equal(err);
    assertDefaultTags(event);
    assertDefaultData(event);
    assertDefaultMessage(event);
    assertDefaultTimestamp(event);
  });

  it('accepts error,message (error.message is not used as message)',
    async () => {
    const err = new Error('b');
    const event = await normalizeEvent(err, 'a');

    assertErrorSchema(event);
    expect(event.error).to.be.equal(err);
    assertDefaultTags(event);
    assertDefaultData(event);
    expect(event.message).to.be.equal('a');
    assertDefaultTimestamp(event);
  });
});
