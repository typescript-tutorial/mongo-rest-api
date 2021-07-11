export type DataType = 'ObjectId' | 'date' | 'datetime' | 'time'
    | 'boolean' | 'number' | 'integer' | 'string' | 'text'
    | 'object' | 'array' | 'primitives' | 'binary';
export type FormatType = 'currency' | 'percentage' | 'email' | 'url' | 'phone' | 'fax' | 'ipv4' | 'ipv6';

export interface ErrorMessage {
  field: string;
  code: string;
  param?: string|number|Date;
  message?: string;
}

export interface Model {
  attributes: Attributes;
}

export interface Attribute {
  name?: string;
  type?: DataType;
  format?: FormatType;
  required?: boolean;
  key?: boolean;
  length?: number;
  min?: number;
  max?: number;
  gt?: number;
  lt?: number;
  exp?: RegExp|string;
  code?: string;
  typeof?: Model;
}
export interface Attributes {
  [key: string]: Attribute;
}
