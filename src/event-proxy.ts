import { EventEmitter } from 'events';
import { StringKeyedObject } from './interfaces';
import { promisify } from './utils';
import * as hoek from 'hoek';

export interface Event {
  tags: string[];
  message: string;
  data: StringKeyedObject<any>;
  error?: Error;
  timestamp: Date;
}

export interface CreateEventProxyOptions {
  emitter: EventEmitter;
  name: string;
  tags?: string[];
  data?: StringKeyedObject<any>;
}

interface NewProxyOptions {
  emitter: EventEmitter;
  name: string;
  defaultTags?: string[];
  defaultData?: StringKeyedObject<any>;
}

interface NewChildOptions {
  emitter: EventEmitter;
  name: string;
  parentTags?: string[];
  parentData?: StringKeyedObject<any>;
}

export interface EventProxyChildOptions {
  tags?: string[];
  data?: StringKeyedObject<any>;
}

export type EventTags = string[] | EventData;
export type EventData = Error | StringKeyedObject<any> |
  (() => Promise<StringKeyedObject<any>>) | EventMessage;
export type EventMessage = string | EventTimestamp;
export type EventTimestamp = Date;

export interface EventProxy {
  (tags: EventTags, data?: EventData, message?: EventMessage,
    timestamp?: EventTimestamp): void;
  tags: string[];
  data: StringKeyedObject<any>;
  child: (options: EventProxyChildOptions) => EventProxy;
}

export async function normalizeEvent(tags: EventTags, data?: EventData,
  message?: EventMessage, timestamp?: EventTimestamp) : Promise<Event> {
  const args = [...arguments];
  let otherType;

  if (Array.isArray(args[0])) {
    tags = args.shift();
  }

  if (typeof args[0] === 'function') {
    data = await promisify(args.shift())();
  } else if (typeof args[0] === 'object' && !(args[0] instanceof Date) ||
    args[0] === null) {
    data = args.shift();
  }

  if (typeof args[0] === 'string') {
    message = args.shift();
  }

  if (args[0] instanceof Date) {
    timestamp = args.shift();
  }

  if (arguments.length === args.length) {
    // arguments[0] does not match any other supported type
    //
    // TypeScript does not allow anything else but during runtime the function
    // may receive additional data types, for instance if the following code is
    // executed, the 'tags' parameter will contain 123.
    //
    // try {
    //   throw 123;
    // } catch (err) {
    //   app.log(err);
    // }
    //
    // Let's put this uncontrolled data in the 'message' field
    //
    otherType = true;
    message = `${args.shift()}`;
  }

  if (!Array.isArray(tags)) {
    tags = [];
  }

  if (data !== null && typeof data !== 'function' &&
    (typeof data !== 'object' || data instanceof Date)) {
    data = {};
  }

  if (typeof message !== 'string' && !otherType) {
    message = '';
  }

  if (!(timestamp instanceof Date)) {
    timestamp = new Date();
  }

  const event = {
    tags,
    message,
    data,
    timestamp
  } as Event;

  if (data instanceof Error) {
    event.error = data;
    event.data = {};
    event.message = event.message || event.error.message || '';
  }

  return event;
}

const newProxy = ({
  emitter,
  name,
  defaultTags,
  defaultData
}: NewProxyOptions) =>
  (tags: EventTags, data?: EventData, message?: EventMessage,
  timestamp?: EventTimestamp): void => {
    (async () => {
      let event;
      try {
        event = await normalizeEvent(tags, data, message, timestamp);
      } catch (err) {
        emitter.emit('error', err);
        return;
      }
      event.tags.unshift(...defaultTags);
      // Remove duplicate and empty string tags
      event.tags = hoek.unique(event.tags).filter((tag: string) => !!tag);
      event.data = hoek.applyToDefaults(defaultData, event.data, true);
      emitter.emit(name, event, hoek.mapToObject(event.tags));
    })();
  };

const newChild = ({
  emitter,
  name,
  parentTags,
  parentData
}: NewChildOptions) =>
  ({ tags = [], data = {} }: EventProxyChildOptions = {}) : EventProxy =>
  createEventProxy({
    emitter,
    name,
    tags: hoek.unique([...parentTags, ...tags]),
    data: hoek.applyToDefaults(parentData, data)
  });

export function createEventProxy({
  emitter,
  name,
  tags = [],
  data = {}
}: CreateEventProxyOptions): EventProxy {
  const proxy = newProxy({
    emitter,
    name,
    defaultTags: tags,
    defaultData: data
  });

  const child = newChild({
    emitter,
    name,
    parentTags: tags,
    parentData: data
  });

  return Object.assign(proxy, {
    tags,
    data,
    child
  });
}
