export interface StringKeyedObject<T> {
  [key: string]: T;
}

export type AnyFunction = (...args: any[]) => any;
