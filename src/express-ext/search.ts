import {Request, Response} from 'express';
import {Attribute, Attributes} from './metadata';

export interface ArrayMap {
  [key: string]: string[]|number[];
}
export interface SearchModel {
  fields?: string[];
  sort?: string;

  keyword?: string;
  excluding?: ArrayMap;
}
export interface SearchConfig {
  excluding?: string;
  fields?: string;
  list?: string;
  total?: string;
  token?: string;
  last?: string;
  csv?: boolean;
}
export interface SearchResult<T> {
  list: T[];
  total?: number;
  nextPageToken?: string;
  last?: boolean;
}

export function jsonResult<T>(res: Response, result: SearchResult<T>, quick?: boolean, fields?: string[], config?: SearchConfig): void {
  if (quick && fields && fields.length > 0) {
    res.status(200).json(toCsv(fields, result)).end();
  } else {
    res.status(200).json(buildResult(result, config)).end();
  }
}
export function buildResult<T>(r: SearchResult<T>, conf?: SearchConfig): any {
  if (!conf) {
    return r;
  }
  const x: any = {};
  x[conf.list] = r.list;
  x[conf.total] = r.total;
  if (r.nextPageToken && r.nextPageToken.length > 0) {
    x[conf.token] = r.nextPageToken;
  }
  if (r.last) {
    x[conf.last] = r.last;
  }
  return x;
}
export function initializeConfig(conf: SearchConfig): SearchConfig {
  if (!conf) {
    return undefined;
  }
  const c = {
    excluding: conf.excluding,
    fields: conf.fields,
    list: conf.list,
    total: conf.total,
    token: conf.token,
    last: conf.last,
    quick: conf.csv
  };
  if (!c.excluding || c.excluding.length === 0) {
    c.excluding = 'excluding';
  }
  if (!c.fields || c.fields.length === 0) {
    c.fields = 'fields';
  }
  if (!c.list || c.list.length === 0) {
    c.list = 'list';
  }
  if (!c.total || c.total.length === 0) {
    c.list = 'total';
  }
  if (!c.last || c.last.length === 0) {
    c.last = 'last';
  }
  if (!c.token || c.token.length === 0) {
    c.token = 'nextPageToken';
  }
  return c;
}
export function fromRequest<S>(req: Request, fields?: string, excluding?: string): S {
  const s: any = (req.method === 'GET' ? fromUrl(req, fields, excluding) : req.body);
  return s;
}
export function fromUrl<S>(req: Request, fields?: string, excluding?: string): S {
  if (!fields || fields.length === 0) {
    fields = 'fields';
  }
  const s: any = {};
    const obj = req.query;
    const keys = Object.keys(obj);
    for (const key of keys) {
      if (key === fields) {
        const x = (obj[key] as string).split(',');
        s[key] = x;
      } else if (key === excluding) {
        const x = (obj[key] as string).split(',');
        s[key] = x;
      } else {
        setValue(s, key, obj[key] as string);
      }
    }
    return s;
}
/*
export function setValue<T>(obj: T, path: string, value: string): void {
  const paths = path.split('.');
  if (paths.length === 1) {
    obj[path] = value;
  } else {
    let current: any = obj;
    const l = paths.length - 1;
    for (let i = 0; i < l; i++) {
      const sub = paths[i];
      if (!obj[sub]) {
        obj[sub] = {};
      }
      current = obj[sub];
    }
    current[paths[paths.length - 1]] = value;
  }
}
*/
export function setValue<T, V>(obj: T, path: string, value: V): void {
  const paths = path.split('.');
  if (paths.length === 1) {
    obj[path] = value;
  } else {
    let o = obj;
    const l = paths.length - 1;
    for (let i = 0; i < l - 1; i++) {
      const p = paths[i];
      if (p in o) {
        o = o[p];
      } else {
        o[p] = {};
        o = o[p];
      }
    }
    o[paths[paths.length - 1]] = value;
  }
}
export interface Limit {
  limit?: number;
  skip?: number;
  refId?: string;
  fields?: string[];
  skipOrRefId?: string|number;
}
export function getParameters<T>(obj: T, sfield?: string): Limit {
  if (!sfield || sfield.length === 0) {
    sfield = 'fields';
  }
  let fields;
  const fs = obj[sfield];
  if (fs && Array.isArray(fs)) {
    fields = fs;
    delete obj[sfield];
  }
  let refId = obj['refId'];
  if (!refId) {
    refId = obj['nextPageToken'];
  }
  const r: Limit = {fields, refId};
  let pageSize = obj['limit'];
  if (!pageSize) {
    pageSize = obj['pageSize'];
  }
  if (pageSize && !isNaN(pageSize)) {
    const ipageSize = Math.floor(parseFloat(pageSize));
    if (ipageSize > 0) {
      r.limit = ipageSize;
      const skip = obj['skip'];
      if (skip && !isNaN(skip)) {
        const iskip = Math.floor(parseFloat(skip));
        if (iskip >= 0) {
          r.skip = iskip;
          r.skipOrRefId = r.skip;
          deletePageInfo(obj);
          return r;
        }
      }
      let pageIndex = obj['page'];
      if (!pageIndex) {
        pageIndex = obj['pageIndex'];
        if (!pageIndex) {
          pageIndex = obj['pageNo'];
        }
      }
      if (pageIndex && !isNaN(pageIndex)) {
        let ipageIndex = Math.floor(parseFloat(pageIndex));
        if (ipageIndex < 1) {
          ipageIndex = 1;
        }
        let firstPageSize = obj['firstLimit'];
        if (!firstPageSize) {
          firstPageSize = obj['firstPageSize'];
        }
        if (!firstPageSize) {
          firstPageSize = obj['initPageSize'];
        }
        if (firstPageSize && !isNaN(firstPageSize)) {
          const ifirstPageSize = Math.floor(parseFloat(firstPageSize));
          if (ifirstPageSize > 0) {
            r.skip = ipageSize * (ipageIndex - 2) + ifirstPageSize;
            r.skipOrRefId = r.skip;
            deletePageInfo(obj);
            return r;
          }
        }
        r.skip = ipageSize * (ipageIndex - 1);
        r.skipOrRefId = r.skip;
        deletePageInfo(obj);
        return r;
      }
      r.skip = 0;
      if (r.refId && r.refId.length > 0) {
        r.skipOrRefId = r.refId;
      }
      deletePageInfo(obj);
      return r;
    }
  }
  if (r.refId && r.refId.length > 0) {
    r.skipOrRefId = r.refId;
  }
  deletePageInfo(obj);
  return r;
}
export function deletePageInfo(obj: any): void {
  delete obj['limit'];
  delete obj['firstLimit'];
  delete obj['skip'];
  delete obj['page'];
  delete obj['pageNo'];
  delete obj['pageIndex'];
  delete obj['pageSize'];
  delete obj['initPageSize'];
  delete obj['firstPageSize'];
  delete obj['refId'];
  delete obj['nextPageToken'];
}
const re = /"/g;
export function toCsv<T>(fields: string[], r: SearchResult<T>): string {
  if (!r || r.list.length === 0) {
    return '0';
  } else {
    const e = '';
    const s = 'string';
    const n = 'number';
    const b = '""';
    const rows: string[] = [];
    rows.push('' + (r.total ? r.total : '') + ',' + (r.nextPageToken ? r.nextPageToken : '') + ',' + (r.last ? '1' : ''));
    for (const item of r.list) {
      const cols: string[] = [];
      for (const name of fields) {
        const v = item[name];
        if (!v) {
          cols.push(e);
        } else {
          if (typeof v === s) {
            if (s.indexOf(',') >= 0) {
              cols.push('"' + v.replace(re, b) + '"');
            } else {
              cols.push(v);
            }
          } else if (v instanceof Date) {
            cols.push(v.toISOString());
          } else if (typeof v === n) {
            cols.push(v.toString());
          } else {
            cols.push('');
          }
        }
      }
      rows.push(cols.join(','));
    }
    return rows.join('\n');
  }
}

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
  startTime?: Date;
  endTime?: Date;
  min?: Date;
  max?: Date;
  upper?: Date;
}
export interface NumberRange {
  min?: number;
  max?: number;
  lower?: number;
  upper?: number;
}
export interface Metadata {
  dates?: string[];
  numbers?: string[];
}
export function buildMetadata(attributes: Attributes, includeDate?: boolean): Metadata {
  const keys: string[] = Object.keys(attributes);
  const dates: string[] = [];
  const numbers: string[] = [];
  for (const key of keys) {
    const attr: Attribute = attributes[key];
    if (attr.type === 'number' || attr.type === 'integer') {
      numbers.push(key);
    } else if (attr.type === 'datetime' || (includeDate === true && attr.type === 'date')) {
      dates.push(key);
    }
  }
  const m: Metadata = {};
  if (dates.length > 0) {
    m.dates = dates;
  }
  if (numbers.length > 0) {
    m.numbers = numbers;
  }
  return m;
}

const _datereg = '/Date(';
const _re = /-?\d+/;
function toDate(v: any) {
  if (!v || v === '') {
    return null;
  }
  if (v instanceof Date) {
    return v;
  } else if (typeof v === 'number') {
    return new Date(v);
  }
  const i = v.indexOf(_datereg);
  if (i >= 0) {
    const m = _re.exec(v);
    const d = parseInt(m[0], null);
    return new Date(d);
  } else {
    if (isNaN(v)) {
      return new Date(v);
    } else {
      const d = parseInt(v, null);
      return new Date(d);
    }
  }
}

export function format<T>(obj: T, dates?: string[], nums?: string[]): T {
  if (dates && dates.length > 0) {
    for (const s of dates) {
      const v = obj[s];
      if (v) {
        if (v instanceof Date) {
          continue;
        }
        if (typeof v === 'string' || typeof v === 'number') {
          const d = toDate(v);
          const error = d.toString();
          if (!(d instanceof Date) || error === 'Invalid Date') {
            delete obj[s];
          } else {
            obj[s] = d;
          }
        } else if (typeof v === 'object') {
          const keys = Object.keys(v);
          for (const key of keys) {
            const v2 = v[key];
            if (v2 instanceof Date) {
              continue;
            }
            if (typeof v2 === 'string' || typeof v2 === 'number') {
              const d2 = toDate(v2);
              const error2 = d2.toString();
              if (!(d2 instanceof Date) || error2 === 'Invalid Date') {
                delete v[key];
              } else {
                v[key] = d2;
              }
            }
          }
        }
      }
    }
  }
  if (nums && nums.length > 0) {
    for (const s of nums) {
      const v = obj[s];
      if (v) {
        if (v instanceof Date) {
          delete obj[s];
          continue;
        }
        if (typeof v === 'number') {
          continue;
        }
        if (typeof v === 'string') {
          if (!isNaN(v as any)) {
            delete obj[s];
            continue;
          } else {
            const i = parseFloat(v);
            obj[s] = i;
          }
        } else if (typeof v === 'object') {
          const keys = Object.keys(v);
          for (const key of keys) {
            const v2 = v[key];
            if (v2 instanceof Date) {
              delete obj[key];
              continue;
            }
            if (typeof v2 === 'number') {
              continue;
            }
            if (typeof v2 === 'string') {
              if (!isNaN(v2 as any)) {
                delete v[key];
              } else {
                const i = parseFloat(v2);
                v[key] = i;
              }
            }
          }
        }
      }
    }
  }
  return obj;
}
