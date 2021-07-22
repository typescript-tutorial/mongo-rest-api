import {Request, Response} from 'express';
import {attrs, handleError, respondModel} from './http';
import {Attribute, Attributes} from './metadata';
import {buildAndCheckId, buildKeys} from './view';

export interface ViewService<T, ID> {
  metadata?(): Attributes;
  load(id: ID, ctx?: any): Promise<T>;
}
function getViewFunc<T, ID>(viewService: ViewService<T, ID> | ((id: ID, ctx?: any) => Promise<T>)): (id: ID, ctx?: any) => Promise<T> {
  if (typeof viewService === 'function') {
    return viewService;
  }
  return viewService.load;
}
function getKeysFunc<T, ID>(viewService: ViewService<T, ID> | ((id: ID, ctx?: any) => Promise<T>), keys?: Attributes|Attribute[]|string[]): Attribute[] {
  if (keys) {
    if (Array.isArray(keys)) {
      if (keys.length > 0) {
        if (typeof keys[0] === 'string') {
          return attrs(keys as string[]);
        } else {
          return keys as Attribute[];
        }
      }
      return undefined;
    } else {
      return buildKeys(keys as Attributes);
    }
  }
  if (typeof viewService !== 'function' && viewService.metadata) {
    const metadata = viewService.metadata();
    if (metadata) {
      return buildKeys(metadata);
    }
  }
  return undefined;
}
export class LoadController<T, ID> {
  protected keys?: Attribute[];
  protected view: (id: ID, ctx?: any) => Promise<T>;
  constructor(protected log: (msg: any, ctx?: any) => void, viewService: ViewService<T, ID> | ((id: ID, ctx?: any) => Promise<T>), keys?: Attributes|Attribute[]|string[]) {
    this.load = this.load.bind(this);
    this.view = getViewFunc(viewService);
    this.keys = getKeysFunc(viewService, keys);
  }
  load(req: Request, res: Response) {
    const id = buildAndCheckId<ID>(req, res, this.keys);
    if (id) {
      this.view(id)
        .then(obj => respondModel(obj, res))
        .catch(err => handleError(err, res, this.log));
    }
  }
}