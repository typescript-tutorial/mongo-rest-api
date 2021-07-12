import {Response} from 'express';
import {Attribute, ErrorMessage} from './metadata';
import {handleError} from './response';

export interface StatusConfig {
  duplicate_key?: number|string;
  not_found?: number|string;
  success?: number|string;
  version_error?: number|string;
  validation_error?: number|string;
  error?: number|string;
}
export interface ResultInfo<T> {
  status: number|string;
  errors?: ErrorMessage[];
  value?: T;
  message?: string;
}
export function initializeStatus(s: StatusConfig): StatusConfig {
  if (s) {
    return s;
  }
  const s1: StatusConfig = {
    duplicate_key: 0,
    not_found: 0,
    success: 1,
    version_error: 2,
    error: 4
  };
  return s1;
}
export function checkId<T, ID>(obj: T, id: ID, keys: Attribute[]): boolean {
  let n = 'id';
  if (keys && keys.length === 1) {
    n = keys[0].name;
  }
  if (!keys || keys.length === 1) {
    const v = obj[n];
    if (!v) {
      obj[n] = id;
      return true;
    }
    // tslint:disable-next-line:triple-equals
    if (v != id) {
      return false;
    }
    return true;
  }
  const ks = Object.keys(id);
  for (const k of ks) {
    const v = obj[k];
    if (!v) {
      obj[k] = id[k];
    } else {
      // tslint:disable-next-line:triple-equals
      if (v != id[k]) {
        return false;
      }
    }
    obj[k] = id[k];
  }
  return true;
}
export function create<T>(res: Response, status: StatusConfig, obj: T, insert: (obj: T, ctx?: any) => Promise<number|ResultInfo<T>>, log: (msg: string, ctx?: any) => void): void {
  insert(obj).then(result => {
    if (typeof result === 'number') {
      if (result >= 1) {
        const r: ResultInfo<T> = {status: status.success, value: obj};
        res.status(201).json(r).end();
      } else if (result === 0) {
        const r: ResultInfo<T> = {status: status.duplicate_key};
        res.status(201).json(r).end();
      } else {
        res.status(500).end('Internal Server Error');
      }
    } else {
      res.status(200).json(result).end();
    }
  }).catch(err => handleError(err, res, log));
}
export function update<T>(res: Response, status: StatusConfig, obj: T, save: (obj: T, ctx?: any) => Promise<number|ResultInfo<T>>, log: (msg: string, ctx?: any) => void): void {
  save(obj).then(result => {
    if (typeof result === 'number') {
      if (result >= 1) {
        const r: ResultInfo<T> = {status: status.success, value: obj};
        res.status(201).json(r).end();
      } else if (result === 0) {
        const r: ResultInfo<T> = {status: status.not_found};
        res.status(404).json(r).end();
      } else {
        const r: ResultInfo<T> = {status: status.not_found};
        res.status(409).json(r).end();
      }
    } else {
      res.status(200).json(result).end();
    }
  }).catch(err => handleError(err, res, log));
}
export function isTypeError(errs: ErrorMessage[]): boolean {
  if (!errs) {
    return false;
  }
  for (const err of errs) {
    const c = err.code;
    if (c === 'string' || c === 'number' || c === 'date' || c === 'boolean') {
      return true;
    }
  }
  return false;
}
