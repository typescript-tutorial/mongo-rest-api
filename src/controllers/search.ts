import {Request, Response} from 'express';

export interface ArrayMap {
  [key: string]: string[]|number[];
}

export interface SearchModel {
  page?: number;
  limit?: number;
  firstLimit?: number;
  fields?: string[];
  sort?: string;
  currentUserId?: string;

  keyword?: string;
  excluding?: ArrayMap;
  refId?: string|number;

  pageNo?: number;
  pageIndex?: number;
  pageSize?: number;
  initPageSize?: number;
}
export interface SearchConfig {
  list?: string;
  total?: string;
  token?: string;
  last?: string;
  csv?: boolean;
}
export interface SearchResult<T> {
  list: T[];
  total?: number;
  last?: boolean;
}

export function jsonResult<T>(res: Response, result: SearchResult<T>, quick?: boolean, fields?: string[], config?: SearchConfig): void {
  if (quick && fields && fields.length > 0) {
    res.status(200).json(toCsv(fields, result));
  } else {
    res.status(200).json(buildResult(result, config));
  }
}
export function buildResult<T>(r: SearchResult<T>, conf?: SearchConfig): any {
  if (!conf) {
    return r;
  }
  const x: any = {};
  x[conf.list] = r.list;
  x[conf.total] = r.total;
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
    list: conf.list,
    total: conf.total,
    token: conf.token,
    last: conf.last,
    quick: conf.csv
  };
  if (!c.list || c.list.length === 0) {
    c.list = 'list';
  }
  if (!c.total || c.total.length === 0) {
    c.list = 'total';
  }
  if (!c.last || c.last.length === 0) {
    c.last = 'last';
  }
  return c;
}
export function fromRequest<S>(req: Request, format?: (s: S) => S): S {
  const s = (req.method === 'GET' ? fromUrl(req, format) : fromBody(req, format));
  return s;
}
export function fromBody<S>(req: Request, format?: (s: S) => S): S {
  const s = req.body;
  if (!format) {
    return s;
  }
  return format(s);
}
export function fromUrl<S>(req: Request, format?: (s: S) => S): S {
  const s: any = {};
    const obj = req.query;
    const keys = Object.keys(obj);
    for (const key of keys) {
      if (key === 'fields') {
        const x = (obj[key] as string).split(',');
        s[key] = x;
      } else {
        s[key] = obj[key];
      }
    }
    if (format) {
      format(s);
    }
    return s;
}
export interface Limit {
  limit?: number;
  skip?: number;
  refId?: string;
}
export function getLimit<T>(obj: T): Limit {
  let refId = obj['refId'];
  if (!refId) {
    refId = obj['nextPageToken'];
  }
  let pageSize = obj['limit'];
  if (!pageSize) {
    pageSize = obj['pageSize'];
  }
  if (pageSize && !isNaN(pageSize)) {
    const ipageSize = Math.floor(parseFloat(pageSize));
    if (ipageSize > 0) {
      const skip = obj['skip'];
      if (skip && !isNaN(skip)) {
        const iskip = Math.floor(parseFloat(skip));
        if (iskip >= 0) {
          deletePageInfo(obj);
          return {limit: ipageSize, skip: iskip};
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
            deletePageInfo(obj);
            return {limit: ipageSize, skip: ipageSize * (ipageIndex - 2) + ifirstPageSize};
          }
        }
        deletePageInfo(obj);
        return {limit: ipageSize, skip: ipageSize * (ipageIndex - 1)};
      }
      deletePageInfo(obj);
      return {limit: ipageSize, skip: 0, refId};
    }
  }
  return {limit: undefined, skip: undefined, refId};
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
    rows.push('' + r.total + ',' + (r.last ? '1' : ''));
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

export interface SearchModelBuilder<S extends SearchModel> {
  buildFromRequestUrl(req: Request): S;
  buildFromRequestBody(req: Request): S;
}
export class DefaultSearchModelBuilder<S extends SearchModel> implements SearchModelBuilder<S> {
  constructor(protected format: (s: S) => S) {
  }
  buildFromRequestUrl(req: Request): S {
    const s: any = {};
    const obj = req.query;
    const keys = Object.keys(obj);
    for (const key of keys) {
      if (key === 'fields') {
        const x = (obj[key] as string).split(',');
        s[key] = x;
      } else {
        s[key] = obj[key];
      }
    }
    formatSearchModel(s);
    if (this.format) {
      this.format(s);
    }
    return s;
  }
  buildFromRequestBody(req: Request): S {
    const s = req.body;
    formatSearchModel(s);
    if (this.format) {
      this.format(s);
    }
    return s;
  }
}
export function formatSearchModel<S extends SearchModel>(s: S): S {
  if (!s.sort) {
    s.sort = '';
  }
  const pageSize: any = (s.hasOwnProperty('limit' ) ? s.limit : 0);
  const page: any = s.page;
  const initPageSize: any = (!s.hasOwnProperty('firstLimit') || !s.firstLimit ? pageSize : s.firstLimit);
  if (!!pageSize) {
    s.limit = (isNaN(pageSize) ? 0 : Math.floor(parseFloat(pageSize)));
  }
  if (!!page) {
    s.page = (isNaN(page) ? 0 : Math.floor(parseFloat(page)));
  }
  if (!!initPageSize) {
    s.firstLimit = (isNaN(initPageSize) ? 0 : Math.floor(parseFloat(initPageSize)));
  }
  if (!s.firstLimit) {
    s.firstLimit = s.limit;
  }
  if (!s.hasOwnProperty('page') || !s.page || s.page < 1) {
    s.page = 1;
  }
  /*
  if (!s.hasOwnProperty('keyword') || !s.keyword) {
    s.keyword = '';
  }
  */
  return s;
}
