import {Request, Response} from 'express';
import {checkId, create, initializeStatus, isTypeError, ResultInfo, StatusConfig, update} from './edit';
import {LoadController} from './LoadController';
import {Attributes, ErrorMessage, Model} from './metadata';
import {resources} from './resources';
import {handleError} from './response';
import {buildId} from './view';

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
  metadata: Attributes;
  constructor(log: (msg: string, ctx?: any) => void, public service: GenericService<T, ID, number|ResultInfo<T>>, status?: StatusConfig, public validate?: (obj: T, patch?: boolean) => Promise<ErrorMessage[]>) {
    super(log, service);
    this.status = initializeStatus(status);
    if (service.metadata) {
      const m = service.metadata();
      if (m) {
        this.metadata = m.attributes;
      }
    }
    this.insert = this.insert.bind(this);
    this.update = this.update.bind(this);
    this.patch = this.patch.bind(this);
    this.delete = this.delete.bind(this);
    if (!validate && resources.createValidator && this.metadata) {
      const v = resources.createValidator(this.metadata);
      this.validate = v.validate;
    }
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
      this.validate(obj, true).then(errors => {
        if (errors && errors.length > 0) {
          const r: ResultInfo<T> = {status: this.status.validation_error, errors};
          res.status(getStatusCode(errors)).json(r);
        } else {
          update(res, this.status, obj, this.service.patch, this.log);
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
function getStatusCode(errs: ErrorMessage[]): number {
  return (isTypeError(errs) ? 400 : 422);
}
