import { AnyFunction } from '../interfaces';

export default function(fn: AnyFunction): AnyFunction {
  // tslint:disable-next-line:only-arrow-functions
  return async function(...args: any[]): Promise<any> {
    return fn.apply(this, args);
  };
}
