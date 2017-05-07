import { EventEmitter } from 'events';
import fulfiller from 'fulfiller';
import * as hoek from 'hoek';

export interface EventTagsMap {
  [key: string]: boolean;
}

export interface EventDataMap {
  [key: string]: any;
}

export interface Event {
  tags: string[];
  message: string;
  data: EventDataMap;
  error?: Error;
  timestamp: Date;
}

export interface CreateEventProxyOptions {
  emitter: EventEmitter | EventEmitter[];
  name: string;
  tags?: string[];
  data?: EventDataMap;
}

interface NewProxyOptions {
  emitters: EventEmitter[];
  name: string;
  defaultTags: string[];
  defaultData: EventDataMap;
}

interface NewChildOptions {
  emitters: EventEmitter[];
  name: string;
  parentTags: string[];
  parentData: EventDataMap;
}

export interface EventProxyChildOptions {
  tags?: string[];
  data?: EventDataMap;
}

export type EventError = Error | EventTags;
export type EventTags = string[] | EventData;
export type EventData = EventDataMap | (() => Promise<EventDataMap>) |
  EventMessage;
export type EventMessage = string | EventTimestamp;
export type EventTimestamp = Date;

export interface EventProxy {
  (error?: EventError, tags?: EventTags, data?: EventData,
    message?: EventMessage, timestamp?: EventTimestamp): void;
  tags: string[];
  data: EventDataMap;
  child: (options?: EventProxyChildOptions) => EventProxy;
}

export async function normalizeEvent(error?: EventError, tags?: EventTags,
  data?: EventData, message?: EventMessage, timestamp?: EventTimestamp)
  : Promise<Event> {
  const args = [...arguments];
  const defaultTags: string[] = [];
  const defaultData: EventDataMap = {};
  const defaultMessage = '';
  const defaultTimestamp = new Date();

  const emptyArgs = args.filter((arg: any) => arg !== undefined &&
    arg !== null);

  if (!emptyArgs.length) {
    return {
      tags: defaultTags,
      data: defaultData,
      message: defaultMessage,
      timestamp: defaultTimestamp
    };
  }

  if (args[0] instanceof Error) {
    error = args.shift();
  }

  if (Array.isArray(args[0])) {
    tags = args.shift();
  }

  if (typeof args[0] === 'function') {
    data = await fulfiller(args.shift())();
  } else if (typeof args[0] === 'object' && !(args[0] instanceof Date)) {
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
    //   eventProxy(err);
    // }
    //
    // Let's store this unexpected data in the 'error' field.
    const unexpectedArg = args.shift();
    error = new Error(`unexpected parameter type: ${unexpectedArg}`);
  }

  const isError = error instanceof Error;

  if (!Array.isArray(tags)) {
    tags = defaultTags;
  }

  if (typeof data !== 'function' &&
    (typeof data !== 'object' || data instanceof Date)) {
    data = defaultData;
  }

  if (typeof message !== 'string') {
    message = defaultMessage;
  }

  if (!(timestamp instanceof Date)) {
    timestamp = defaultTimestamp;
  }

  const event = {
    tags,
    data,
    message,
    timestamp
  } as Event;

  if (isError) {
    event.error = error as Error;
  }

  return event;
}

const newProxy = ({
  emitters,
  name,
  defaultTags,
  defaultData
}: NewProxyOptions) =>
  (error?: EventError, tags?: EventTags, data?: EventData,
  message?: EventMessage, timestamp?: EventTimestamp): void => {
    (async () => {
      let event;
      try {
        event = await normalizeEvent(error, tags, data, message, timestamp);
      } catch (err) {
        for (const emitter of emitters) {
          emitter.emit('error', err);
        }
        return;
      }
      event.tags.unshift(...defaultTags);
      // Remove duplicate and empty string tags
      event.tags = hoek.unique(event.tags).filter((tag: string) => !!tag);
      event.data = hoek.applyToDefaults(defaultData, event.data, true);
      const tagsObj: EventTagsMap = hoek.mapToObject(event.tags);
      for (const emitter of emitters) {
        emitter.emit(name, event, tagsObj);
      }
    })();
  };

const newChild = ({
  emitters,
  name,
  parentTags,
  parentData
}: NewChildOptions) =>
  ({ tags = [], data = {} }: EventProxyChildOptions = {}) : EventProxy =>
  createEventProxy({
    emitter: emitters,
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
  const emitters = ([] as EventEmitter[]).concat(emitter);

  const proxy = newProxy({
    emitters,
    name,
    defaultTags: tags,
    defaultData: data
  });

  const child = newChild({
    emitters,
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
