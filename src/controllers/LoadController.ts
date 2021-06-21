import {Request, Response} from 'express';
import {Attribute, Attributes, Model} from './metadata';

export interface ViewService<T, ID> {
  metadata?(): Model;
  load(id: ID, ctx?: any): Promise<T>;
}
export function buildId<T>(req: Request, attrs?: Attribute[]): T {
  let key = 'id';
  if (attrs && attrs.length === 1) {
    const id = req.params[key];
    if (id && id.length > 0) {
      return id as any;
    }
    key = (attrs[0].name ? attrs[0].name : 'id');
  }
  if (!attrs || attrs.length <= 1) {
    const id = req.params[key];
    if (!id || id.length === 0) {
      return null;
    }
    return id as any;
  }
  const ids: any = {};
  for (const attr of attrs) {
    const v = req.params[attr.name];
    if (!v) {
      return null;
    }
    if (attr.type === 'integer' || attr.type === 'number') {
      if (isNaN(v as any)) {
        return null;
      }
      ids[attr.name] = parseFloat(v);
    } else {
      ids[attr.name] = v;
    }
    return ids;
  }
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
          const attrs: Attribute[] = [];
          for (const str of keys) {
            const attr: Attribute = {name: str as string, type: 'string'};
            attrs.push(attr);
          }
          return attrs;
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
      return buildKeys(metadata.attributes);
    }
  }
  return undefined;
}
export function buildKeys(attrs: Attributes): Attribute[] {
  if (!attrs) {
    return undefined;
  }
  const keys: string[] = Object.keys(attrs);
  const ats: Attribute[] = [];
  for (const key of keys) {
    const attr: Attribute = attrs[key];
    if (attr) {
      if (attr.key === true) {
        const at: Attribute = {name: key, type: attr.type};
        ats.push(at);
      }
    }
  }
  return ats;
}
export class LoadController<T, ID> {
  protected keys?: Attribute[];
  protected view: (id: ID, ctx?: any) => Promise<T>;
  constructor(protected log: (msg: string, ctx?: any) => void, viewService: ViewService<T, ID> | ((id: ID, ctx?: any) => Promise<T>), keys?: Attributes|Attribute[]|string[]) {
    this.load = this.load.bind(this);
    this.view = getViewFunc(viewService);
    this.keys = getKeysFunc(viewService, keys);
  }
  load(req: Request, res: Response) {
    const id = buildId<ID>(req, this.keys);
    if (!id) {
      return res.status(400).end('Invalid parameters');
    }
    this.view(id).then(obj => {
      if (obj) {
        res.status(200).json(obj);
      } else {
        res.status(404).json(null);
      }
    }).catch(err => {
      if (this.log) {
        this.log(err as any);
      }
      res.status(500).send('Internal Server Error');
    });
  }
}
