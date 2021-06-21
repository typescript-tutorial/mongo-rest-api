export type DataType = 'ObjectId' | 'date' | 'datetime' | 'time'
    | 'boolean' | 'number' | 'integer' | 'string' | 'text'
    | 'object' | 'array' | 'primitives' | 'binary';
export type FormatType = 'currency' | 'percentage' | 'email' | 'url' | 'phone' | 'fax' | 'ipv4' | 'ipv6';
export interface Model {
  name?: string;
  attributes: Attributes;
  source?: string;
  collection?: string;
  model?: any;
  schema?: any;
}

export interface Attribute {
  name?: string;
  field?: string;
  type: DataType;
  format?: FormatType;
  required?: boolean;
  defaultValue?: any;
  key?: boolean;
  unique?: boolean;
  noinsert?: boolean;
  noupdate?: boolean;
  nopatch?: boolean;
  version?: boolean;
  length?: number;
  min?: number;
  max?: number;
  gt?: number;
  lt?: number;
  precision?: number;
  scale?: number;
  exp?: RegExp|string;
  code?: string;
  noformat?: boolean;
  ignored?: boolean;
  jsonField?: string;
  link?: string;
  typeof?: Model;
}
export interface Attributes {
  [key: string]: Attribute;
}
