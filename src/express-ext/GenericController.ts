import {Request, Response} from 'express';
import {checkId, create, initializeStatus, isTypeError, ResultInfo, StatusConfig, update} from './edit';
import {handleError} from './http';
import {LoadController} from './LoadController';
import {Attribute, Attributes, ErrorMessage} from './metadata';
import {resources} from './resources';
import {buildAndCheckId, buildId} from './view';

export interface GenericService<T, ID, R> {
  metadata?(): Attributes;
  load(id: ID, ctx?: any): Promise<T>;
  insert(obj: T, ctx?: any): Promise<R>;
  update(obj: T, ctx?: any): Promise<R>;
  patch?(obj: T, ctx?: any): Promise<R>;
  delete?(id: ID, ctx?: any): Promise<number>;
}
export class GenericController<T, ID> extends LoadController<T, ID> {
  status: StatusConfig;
  metadata: Attributes;
  constructor(log: (msg: string, ctx?: any) => void, public service: GenericService<T, ID, number|ResultInfo<T>>, status?: StatusConfig, public validate?: (obj: T, patch?: boolean) => Promise<ErrorMessage[]>) {
    super(log, service);
    this.status = initializeStatus(status);
    if (service.metadata) {
      const m = service.metadata();
      if (m) {
        this.metadata = m;
      }
    }
    this.create = this.create.bind(this);
    this.insert = this.insert.bind(this);
    this.update = this.update.bind(this);
    this.patch = this.patch.bind(this);
    this.delete = this.delete.bind(this);
    if (!validate && resources.createValidator && this.metadata) {
      const v = resources.createValidator(this.metadata);
      this.validate = v.validate;
    }
  }
  create(req: Request, res: Response) {
    return this.insert(req, res);
  }
  insert(req: Request, res: Response) {
    validateAndCreate(req, res, this.status, this.service.insert, this.log, this.validate);
  }
  update(req: Request, res: Response) {
    const id = buildAndCheckIdWithBody<T, ID>(req, res, this.keys);
    if (id) {
      validateAndUpdate(res, this.status, req.body, false, this.service.update, this.log, this.validate);
    }
  }
  patch(req: Request, res: Response) {
    const id = buildAndCheckIdWithBody<T, ID>(req, res, this.keys);
    if (id) {
      validateAndUpdate(res, this.status, req.body, true, this.service.patch, this.log, this.validate);
    }
  }
  delete(req: Request, res: Response) {
    const id = buildAndCheckId<ID>(req, res, this.keys);
    if (id) {
      this.service.delete(id).then(count => {
        res.status(getDeleteStatus(count)).json(count).end();
      }).catch(err => handleError(err, res, this.log));
    }
  }
}
export function validateAndCreate<T>(req: Request, res: Response, status: StatusConfig, save: (obj: T, ctx?: any) => Promise<number|ResultInfo<T>>, log: (msg: string, ctx?: any) => void, validate?: (obj: T, patch?: boolean) => Promise<ErrorMessage[]>): void {
  const obj = req.body;
  if (!obj || obj === '') {
    return res.status(400).end('The request body cannot be empty.');
  }
  if (validate) {
    validate(obj).then(errors => {
      if (errors && errors.length > 0) {
        const r: ResultInfo<T> = {status: status.validation_error, errors};
        res.status(getStatusCode(errors)).json(r).end();
      } else {
        create(res, status, obj, save, log);
      }
    }).catch(err => handleError(err, res, log));
  } else {
    create(res, status, obj, save, log);
  }
}
export function validateAndUpdate<T>(res: Response, status: StatusConfig, obj: T, isPatch: boolean, save: (obj: T, ctx?: any) => Promise<number|ResultInfo<T>>, log: (msg: string, ctx?: any) => void, validate?: (obj: T, patch?: boolean) => Promise<ErrorMessage[]>):  void {
  if (validate) {
    validate(obj, isPatch).then(errors => {
      if (errors && errors.length > 0) {
        const r: ResultInfo<T> = {status: status.validation_error, errors};
        res.status(getStatusCode(errors)).json(r).end();
      } else {
        update(res, status, obj, save, log);
      }
    }).catch(err => handleError(err, res, log));
  } else {
    update(res, status, obj, save, log);
  }
}
export function buildAndCheckIdWithBody<T, ID>(req: Request, res: Response, keys?: Attribute[]): ID {
  const obj = req.body;
  if (!obj || obj === '') {
    res.status(400).end('The request body cannot be empty.');
    return undefined;
  }
  const id = buildId<ID>(req, keys);
  if (!id) {
    res.status(400).end('Invalid parameters');
    return undefined;
  }
  const ok = checkId<T, ID>(obj, id, keys);
  if (!ok) {
    res.status(400).end('body and url are not matched');
    return undefined;
  }
  return id;
}
export function getDeleteStatus(count: number): number {
  if (count > 0) {
    return 200;
  } else if (count === 0) {
    return 404;
  } else {
    return 409;
  }
}
export function getStatusCode(errs: ErrorMessage[]): number {
  return (isTypeError(errs) ? 400 : 422);
}
