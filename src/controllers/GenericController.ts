import {Request, Response} from 'express';
import {buildId, LoadController} from './LoadController';
import {Attribute, ErrorMessage, Model} from './metadata';

export interface StatusConfig {
  duplicate_key?: number|string;
  not_found?: number|string;
  success?: number|string;
  version_error?: number|string;
  validation_error?: number|string;
  error?: number|string;
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
export interface ResultInfo<T> {
  status: number|string;
  errors?: ErrorMessage[];
  value?: T;
  message?: string;
}
export interface GenericService<T, ID, R> {
  metadata?(): Model;
  load(id: ID, ctx?: any): Promise<T>;
  insert(obj: T, ctx?: any): Promise<R>;
  update(obj: T, ctx?: any): Promise<R>;
  patch?(obj: T, ctx?: any): Promise<R>;
  delete?(id: ID, ctx?: any): Promise<number>;
}
export class GenericController<T, ID> extends LoadController<T, ID> {
  status: StatusConfig;
  metadata: Model;
  constructor(log: (msg: string, ctx?: any) => void, protected service: GenericService<T, ID, number|ResultInfo<T>>, status?: StatusConfig, public validate?: (obj: T, ctx?: any) => Promise<ErrorMessage[]>) {
    super(log, service);
    this.status = initializeStatus(status);
    this.metadata = service.metadata();
    this.insert = this.insert.bind(this);
    this.update = this.update.bind(this);
    this.patch = this.patch.bind(this);
    this.delete = this.delete.bind(this);
  }
  insert(req: Request, res: Response) {
    const obj = req.body;
    if (!obj) {
      return res.status(400).end('The request body cannot be empty.');
    }
    if (this.validate) {
      const l = this.log;
      this.validate(obj).then(errors => {
        if (errors && errors.length > 0) {
          const r: ResultInfo<T> = {status: this.status.validation_error, errors};
          res.status(getStatusCode(errors)).json(r);
        } else {
          create(res, this.status, obj, this.service.insert, this.log);
        }
      }).catch(err => handleError(err, res, l));
    } else {
      create(res, this.status, obj, this.service.insert, this.log);
    }
  }
  update(req: Request, res: Response) {
    const obj = req.body;
    if (!obj) {
      return res.status(400).end('The request body cannot be empty.');
    }
    const id = buildId<ID>(req, this.keys);
    if (!id) {
      return res.status(400).end('Invalid parameters');
    }
    const ok = checkId<T, ID>(obj, id, this.keys);
    if (!ok) {
      return res.status(400).end('Invalid parameters');
    }
    if (this.validate) {
      const l = this.log;
      this.validate(obj).then(errors => {
        if (errors && errors.length > 0) {
          const r: ResultInfo<T> = {status: this.status.validation_error, errors};
          res.status(getStatusCode(errors)).json(r);
        } else {
          update(res, this.status, obj, this.service.update, this.log);
        }
      }).catch(err => handleError(err, res, l));
    } else {
      update(res, this.status, obj, this.service.update, this.log);
    }
  }
  patch(req: Request, res: Response) {
    const obj = req.body;
    if (!obj) {
      return res.status(400).end('The request body cannot be empty.');
    }
    const id = buildId<ID>(req, this.keys);
    if (!id) {
      return res.status(400).end('Invalid parameters');
    }
    const ok = checkId<T, ID>(obj, id, this.keys);
    if (!ok) {
      return res.status(400).end('Invalid parameters');
    }
    if (this.validate) {
      const l = this.log;
      const ctx: any = {method: 'patch'};
      this.validate(obj, ctx).then(errors => {
        if (errors && errors.length > 0) {
          const r: ResultInfo<T> = {status: this.status.validation_error, errors};
          res.status(getStatusCode(errors)).json(r);
        } else {
          update(res, this.status, obj, this.service.update, this.log);
        }
      }).catch(err => handleError(err, res, l));
    } else {
      update(res, this.status, obj, this.service.update, this.log);
    }
  }
  delete(req: Request, res: Response) {
    const id = buildId<ID>(req, this.keys);
    if (!id) {
      return res.status(400).end('invalid parameters');
    }
    this.service.delete(id).then(count => {
      if (count > 0) {
        res.status(200).json(count);
      } else if (count === 0) {
        res.status(404).json(count);
      } else {
        res.status(409).json(count);
      }
    }).catch(err => {
      if (this.log) {
        this.log(err as any);
      }
      res.status(500).end('Internal Server Error');
    });
  }
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
        res.status(201).json(r);
      } else if (result === 0) {
        const r: ResultInfo<T> = {status: status.duplicate_key};
        res.status(201).json(r);
      } else {
        res.status(500).end('Internal Server Error');
      }
    } else {
      res.status(200).json(result);
    }
  }).catch(err => handleError(err, res, log));
}
export function update<T>(res: Response, status: StatusConfig, obj: T, save: (obj: T, ctx?: any) => Promise<number|ResultInfo<T>>, log: (msg: string, ctx?: any) => void): void {
  save(obj).then(result => {
    if (typeof result === 'number') {
      if (result >= 1) {
        const r: ResultInfo<T> = {status: status.success, value: obj};
        res.status(201).json(r);
      } else if (result === 0) {
        const r: ResultInfo<T> = {status: status.not_found};
        res.status(404).json(r);
      } else {
        const r: ResultInfo<T> = {status: status.not_found};
        res.status(409).json(r);
      }
    } else {
      res.status(200).json(result);
    }
  }).catch(err => handleError(err, res, log));
}
export function handleError(err: any, res: Response, log?: (msg: string, ctx?: any) => void) {
  if (log) {
    log(err as any);
    res.status(500).end('Internal Server Error');
  } else {
    res.status(500).end(err);
  }
}
function getStatusCode(errs: ErrorMessage[]): number {
  return (isTypeError(errs) ? 400 : 422);
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
