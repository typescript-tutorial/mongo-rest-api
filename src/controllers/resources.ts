import {Attributes, ErrorMessage} from './metadata';

// tslint:disable-next-line:class-name
export class resources {
  static createValidator?: <T>(attributes: Attributes, allowUndefined?: boolean, max?: number) => Validator<T>;
}

export interface Validator<T> {
  validate(obj: T, patch?: boolean): Promise<ErrorMessage[]>;
}
