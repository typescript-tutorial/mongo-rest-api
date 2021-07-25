import {FilterQuery} from 'mongodb';
import {Attribute, Attributes} from './metadata';

export function buildQuery<T, S>(s: S, attrs?: Attributes): FilterQuery<T> {
  const a: any = {};
  const b: any = {};
  const keys = Object.keys(s);
  for (const key of keys) {
    const v = s[key];
    let field = key;
    if (v) {
      if (attrs) {
        const attr: Attribute = attrs[key];
        if (attr) {
          field = (attr.field ? attr.field : key);
          if (attr.key) {
            field = '_id';
          }
          if (typeof v === 'string') {
            const exg = buildMatch(v, attr.match);
            a[field] = exg;
          } else if (v instanceof Date) {
            if (attr.match === 'max') {
              b['$lte'] = v;
            } else {
              b['$gte'] = v;
            }
            a[field] = b;
          } else if (typeof v === 'number') {
            if (attr.match === 'max') {
              b['$lte'] = v;
            } else {
              b['$gte'] = v;
            }
            a[field] = b;
          } else if (attr.type === 'ObjectId') {
            a[field] = v;
          } else if (typeof v === 'object') {
            if (attr.type === 'date' || attr.type === 'datetime') {
              if (isDateRange(v)) {
                if (v['max']) {
                  b['$lte'] = v['max'];
                } else if (v['endDate']) {
                  b['$lte'] = v['endDate'];
                } else if (v['upper']) {
                  b['$lt'] = v['upper'];
                } else if (v['endTime']) {
                  b['$lt'] = v['endTime'];
                }
                if (v['min']) {
                  b['$gte'] = v['min'];
                } else if (v['startTime']) {
                  b['$gte'] = v['startTime'];
                } else if (v['startDate']) {
                  b['$gte'] = v['startDate'];
                } else if (v['lower']) {
                  b['$gt'] = v['lower'];
                }
                a[field] = b;
              }
            } else if (attr.type === 'number' || attr.type === 'integer') {
              if (isNumberRange(v)) {
                if (v['max']) {
                  b['$lte'] = v['max'];
                } else if (v['upper']) {
                  b['$lt'] = v['upper'];
                }
                if (v['min']) {
                  b['$gte'] = v['min'];
                } else if (v['lower']) {
                  b['$gt'] = v['lower'];
                }
                a[field] = b;
              }
            }
          }
        } else if (typeof v === 'string' && v.length > 0) {
          a[field] = buildMatch(v, '');
        }
      } else if (typeof v === 'string' && v.length > 0) {
        a[field] = buildMatch(v, '');
      }
    }
  }
  const json: any = Object.assign({}, a);
  return json;
}
export function isEmpty(s: string): boolean {
  return !(s && s.length > 0);
}
export function buildMatch(v: string, match: string): string|RegExp {
  if (match === 'equal') {
    return v;
  } else if (match === 'prefix') {
    return new RegExp(`^${v}`);
  } else {
    return new RegExp(`\\w*${v}\\w*`);
  }
}
export function isDateRange<T>(obj: T): boolean {
  const keys: string[] = Object.keys(obj);
  for (const key of keys) {
    const v = obj[key];
    if (!(v instanceof Date)) {
      return false;
    }
  }
  return true;
}
export function isNumberRange<T>(obj: T): boolean {
  const keys: string[] = Object.keys(obj);
  for (const key of keys) {
    const v = obj[key];
    if (typeof v !== 'number') {
      return false;
    }
  }
  return true;
}
