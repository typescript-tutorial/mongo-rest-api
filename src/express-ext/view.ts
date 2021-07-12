import {Request, Response} from 'express';
import {Attribute, Attributes} from './metadata';

export function buildAndCheckId<ID>(req: Request, res: Response, keys?: Attribute[]) {
  const id = buildId<ID>(req, keys);
  if (!id) {
    res.status(400).end('invalid parameters');
    return null;
  }
  return id;
}
export function buildId<T>(req: Request, attrs?: Attribute[]): T {
  if (!attrs) {
    const id = req.params['id'];
    if (id && id.length > 0) {
      return id as any;
    }
    return null;
  }
  if (attrs && attrs.length === 1) {
    const key = (attrs[0].name ? attrs[0].name : 'id');
    const id = req.params[key];
    if (id && id.length > 0) {
      if (attrs[0].type === 'integer' || attrs[0].type === 'number') {
        if (isNaN(id as any)) {
          return null;
        }
        const v = parseFloat(id);
        return v as any;
      }
      return id as any;
    }
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
