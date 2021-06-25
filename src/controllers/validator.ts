import {Attribute, Attributes, ErrorMessage, Model} from './metadata';

export interface Phones {
  [key: string]: string;
}
// tslint:disable-next-line:class-name
export class resources {
  static phonecodes: Phones;
  static ignoreDate?: boolean;
  static digit = /^\d+$/;
  static email = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*(\.[a-zA-Z]{2,4})$/i;
  static url = /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
  static ipv4 = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  static ipv6 = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
}

export function isDigitOnly(str: string): boolean {
  if (!str) {
    return false;
  }
  return resources.digit.test(str);
}

// tslint:disable-next-line:class-name
export class tel {
  static isPhone(str: string): boolean {
    if (!str || str.length === 0 || str === '+') {
      return false;
    }
    if (str.charAt(0) !== '+') {
      return isDigitOnly(str);
    } else {
      const phoneNumber = str.substring(1);
      if (!resources.phonecodes) {
        return isDigitOnly(phoneNumber);
      } else {
        if (isDigitOnly(phoneNumber)) {
          for (let degit = 1; degit <= 3; degit++) {
            const countryCode = phoneNumber.substr(0, degit);
            if (countryCode in resources.phonecodes) {
              return true;
            }
          }
          return false;
        } else {
          return false;
        }
      }
    }
  }
  static isFax(fax: string): boolean {
    return tel.isPhone(fax);
  }
}

export function isIPv4(ipv4: string): boolean {
  if (!ipv4 || ipv4.length === 0) {
    return false;
  }
  return resources.ipv4.test(ipv4);
}
export function isIPv6(ipv6: string): boolean {
  if (!ipv6 || ipv6.length === 0) {
    return false;
  }
  return resources.ipv6.test(ipv6);
}
export function isEmail(email: string): boolean {
  if (!email || email.length === 0) {
    return false;
  }
  return resources.email.test(email);
}
export function isUrl(url: string): boolean {
  return resources.url.test(url);
}

function createError(path: string, name: string, code: string, param?: string|number|Date): ErrorMessage {
  let x = name;
  if (path && path.length > 0) {
    x = path + '.' + name;
  }
  const error: ErrorMessage = {
    field: x,
    code
  };
  if (param) {
    error.param = param;
  }
  return error;
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

function handleMinMax(v: number|Date, attr: Attribute, path: string, errors: ErrorMessage[]): void {
  const na = attr.name;
  if (attr.min) {
    if (v < attr.min) {
      errors.push(createError(path, na, 'min', attr.min));
    }
  } else if (attr.gt) {
    if (v <= attr.gt) {
      errors.push(createError(path, na, 'gt', attr.gt));
    }
  }
  if (attr.max) {
    if (v > attr.max) {
      errors.push(createError(path, na, 'max', attr.max));
    }
  } else if (attr.lt) {
    if (v >= attr.lt) {
      errors.push(createError(path, na, 'lt', attr.lt));
    }
  }
}
function validateObject(obj: any, meta: Model, errors: ErrorMessage[], path: string, allowUndefined?: boolean, max?: number, patch?: boolean): void {
  const keys = Object.keys(obj);
  let count = 0;
  for (const key of keys) {
    count = count + 1;
    const attr: Attribute = meta.attributes[key];
    if (!attr) {
      if (!allowUndefined) {
        errors.push(createError(path, key, 'undefined'));
      }
    } else {
      const na = attr.name;
      const v = obj[na];
      console.log('v ' + na + ' ' + v);
      if (!v) {
        if (attr.required && !patch) {
          errors.push(createError(path, na, 'required'));
        }
      } else {
        switch (attr.type) {
          case undefined:
          case 'string':
          case 'text': {
            if (typeof v !== 'string') {
              errors.push(createError(path, na, 'string'));
              return;
            } else {
              if (v.length === 0) {
                if (attr.required) {
                  errors.push(createError(path, na, 'required'));
                }
              } else {
                if (attr.min && attr.min > 0 && v.length < attr.min) {
                  errors.push(createError(path, na, 'minlength', attr.min));
                }
                if (attr.length && attr.length > 0 && v.length > attr.length) {
                  errors.push(createError(path, na, 'maxlength', attr.length));
                }
                if (attr.format) {
                  switch (attr.format) {
                    case 'email': {
                      if (!isEmail(v)) {
                        errors.push(createError(path, na, 'email'));
                      }
                      break;
                    }
                    case 'url': {
                      if (!isUrl(v)) {
                        errors.push(createError(path, na, 'url'));
                      }
                      break;
                    }
                    case 'phone': {
                      if (!tel.isPhone(v)) {
                        errors.push(createError(path, na, 'phone'));
                      }
                      break;
                    }
                    case 'fax': {
                      if (!tel.isFax(v)) {
                        errors.push(createError(path, na, 'fax'));
                      }
                      break;
                    }
                    case 'ipv4': {
                      if (!isIPv4(v)) {
                        errors.push(createError(path, na, 'ipv4'));
                      }
                      break;
                    }
                    case 'ipv6': {
                      if (!isIPv6(v)) {
                        errors.push(createError(path, na, 'ipv6'));
                      }
                      break;
                    }
                    default: {
                      break;
                    }
                  }
                }
                if (attr.exp) {
                  if (typeof attr.exp === 'string') {
                    attr.exp = new RegExp(attr.exp);
                  }
                  const exp: RegExp = attr.exp;
                  if (!exp.test(v)) {
                    const code = (attr.code ? attr.code : 'exp');
                    errors.push(createError(path, na, code));
                  }
                }
              }
            }
            if (errors.length >= max) {
              return;
            }
            break;
          }
          case 'number':
          case 'integer': {
            // If value is not number
            if (typeof v !== 'number') {
              errors.push(createError(path, na, 'number'));
              return;
            } else {
              handleMinMax(v, attr, path, errors);
            }
            if (errors.length >= max) {
              return;
            }
            break;
          }
          case 'datetime':
            const date = toDate(v);
            const error = date.toString();
            if (!(date instanceof Date) || error === 'Invalid Date') {
              errors.push(createError(path, na, 'date'));
              return;
            } else {
              handleMinMax(v, attr, path, errors);
            }
            if (errors.length >= max) {
              return;
            }
            break;
          case 'date': {
            if (resources.ignoreDate) {
              const date2 = toDate(v);
              const error2 = date2.toString();
              if (!(date2 instanceof Date) || error2 === 'Invalid Date') {
                errors.push(createError(path, na, 'date'));
                return;
              } else {
                handleMinMax(v, attr, path, errors);
              }
              if (errors.length >= max) {
                return;
              }
            }
            break;
          }
          case 'boolean': {
            // If value is not bool
            if ((typeof v === 'boolean') !== true) {
              errors.push(createError(path, na, 'boolean'));
              return;
            }
            if (errors.length >= max) {
              return;
            }
            break;
          }
          case 'object': {
            if (typeof v !== 'object') {
              errors.push(createError(path, na, 'object'));
              return;
            } else {
              if (Array.isArray(v)) {
                errors.push(createError(path, na, 'object'));
              } else {
                const x = (path != null && path.length > 0 ? path + '.' + key : key);
                validateObject(v, attr.typeof, errors, x);
              }
            }
            if (errors.length >= max) {
              return;
            }
            break;
          }
          case 'array': {
            if (typeof v !== 'object') {
              errors.push(createError(path, na, 'array'));
              return;
            } else {
              if (!Array.isArray(v)) {
                errors.push(createError(path, na, 'array'));
              } else {
                if (attr.min && attr.min > 0 && v.length < attr.min) {
                  errors.push(createError(path, na, 'min', attr.min));
                }
                if (attr.max && attr.max > 0 && v.length > attr.max) {
                  errors.push(createError(path, na, 'max', attr.max));
                }
                for (let i = 0; i < v.length; i++) {
                  if (typeof v !== 'object') {
                    const y = (path != null && path.length > 0 ? path + '.' + key + '[' + i + ']' : key + '[' + i + ']');
                    errors.push(createError('', y, 'object'));
                    if (errors.length >= max) {
                      return;
                    }
                  } else {
                    const y = (path != null && path.length > 0 ? path + '.' + key + '[' + i + ']' : key + '[' + i + ']');
                    validateObject(v[i], attr.typeof, errors, y);
                  }
                }
              }
            }
            if (errors.length >= max) {
              return;
            }
            break;
          }
          case 'primitives': {
            if (typeof v !== 'object') {
              errors.push(createError(path, na, 'array'));
              return;
            } else {
              if (!Array.isArray(v)) {
                errors.push(createError(path, na, 'array'));
                return;
              } else {
                if (attr.code) {
                  if (attr.code === 'date') {
                    for (let i = 0; i < v.length; i++) {
                      if (v[i]) {
                        const date3 = toDate(v);
                        const error3 = date.toString();
                        if (!(date3 instanceof Date) || error3 === 'Invalid Date') {
                          const y = (path != null && path.length > 0 ? path + '.' + key + '[' + i + ']' : key + '[' + i + ']');
                          const err = createError('', y, 'date');
                          errors.push(err);
                          if (errors.length >= max) {
                            return;
                          }
                        }
                      }
                    }
                  } else {
                    for (let i = 0; i < v.length; i++) {
                      if (v[i] && typeof v[i] !== attr.code) {
                        const y = (path != null && path.length > 0 ? path + '.' + key + '[' + i + ']' : key + '[' + i + ']');
                        const err = createError('', y, attr.code);
                        errors.push(err);
                        if (errors.length >= max) {
                          return;
                        }
                      }
                    }
                  }
                }
                if (attr.min && attr.min > 0 && v.length < attr.min) {
                  errors.push(createError(path, na, 'min', attr.min));
                }
                if (attr.max && attr.max > 0 && v.length > attr.max) {
                  errors.push(createError(path, na, 'max', attr.max));
                }
              }
            }
            if (errors.length >= max) {
              return;
            }
            break;
          }
          default: {
            break;
          }
        }
      }
    }
  }
  if (patch) {
    return;
  }
  const aks = Object.keys(meta.attributes);
  if (!allowUndefined) {
    if (count >= aks.length) {
      return;
    }
  }
  checkUndefined(obj, meta.attributes, errors, aks);
}
export function checkUndefined<T>(obj: T, attrs: Attributes, errors: ErrorMessage[], keys?: string[]): void {
  if (!keys) {
    keys = Object.keys(attrs);
  }
  for (const key of keys) {
    const attr = attrs[key];
    if (attr.required) {
      const v = obj[key];
      if (!v) {
        errors.push(createError('', key, 'required'));
      }
    }
  }
}
export function validate(obj: any, meta: Model, allowUndefined?: boolean, max?: number, patch?: boolean): ErrorMessage[] {
  const errors: ErrorMessage[] = [];
  const path = '';
  if (max == null) {
    max = undefined;
  }
  validateObject(obj, meta, errors, path, allowUndefined, max, patch);
  return errors;
}

export class Validator<T> {
  max: number;
  constructor(public metadata: Model, public allowUndefined?: boolean, max?: number) {
    this.max = (max ? max : 5);
    this.validate = this.validate.bind(this);
  }
  validate(obj: T, patch?: boolean): Promise<ErrorMessage[]> {
    const errors = validate(obj, this.metadata, this.allowUndefined, undefined, patch);
    return Promise.resolve(errors);
  }
}
export function removeRequiredErrors(errs: ErrorMessage[]): ErrorMessage[] {
  const errors: ErrorMessage[] = [];
  for (const err of errs) {
    if (err.code === 'required' && err.field.indexOf('.') < 0) {
      errors.push(err);
    }
  }
  return errors;
}
export interface ValidatorContainer<T> {
  metadata: Model;
  validate?: (obj: T, patch?: boolean) => Promise<ErrorMessage[]>;
}
export function setValidator<T>(c: ValidatorContainer<T>, allowUndefined?: boolean, max?: number): ValidatorContainer<T> {
  const v = new Validator<T>(c.metadata, allowUndefined, max);
  c.validate = v.validate;
  return c;
}
export function setValidators<T>(cs: ValidatorContainer<T>[], allowUndefined?: boolean, max?: number): ValidatorContainer<T>[] {
  for (const c of cs) {
    setValidator(c);
  }
  return cs;
}
