import {Collection} from 'mongodb';
import {insertMany, updateMany, upsertMany} from './mongo';

export class MongoBatchInserter<T> {
  constructor(protected collection: Collection, protected id: string, protected map?: (v: T) => T) {
    this.write = this.write.bind(this);
  }
  write(list: T[]): Promise<number> {
    if (this.map) {
      list = list.map(o => this.map(o));
    }
    return insertMany(this.collection, list, this.id);
  }
}
export class MongoBatchUpdater<T> {
  constructor(protected collection: Collection, protected id: string, protected map?: (v: T) => T) {
    this.write = this.write.bind(this);
  }
  write(list: T[]): Promise<number> {
    if (this.map) {
      list = list.map(o => this.map(o));
    }
    return updateMany(this.collection, list, this.id);
  }
}
export class MongoBatchWriter<T> {
  constructor(protected collection: Collection, protected id: string, protected map?: (v: T) => T) {
    this.write = this.write.bind(this);
  }
  write(list: T[]): Promise<number> {
    if (this.map) {
      list = list.map(o => this.map(o));
    }
    return upsertMany(this.collection, list, this.id);
  }
}
