import {Collection} from 'mongodb';
import {insert, patch, update, upsert} from './mongo';

export class MongoInserter<T> {
  constructor(protected collection: Collection, protected idName: string, protected map?: (v: T) => T) {
    this.write = this.write.bind(this);
  }
  write(obj: T): Promise<number> {
    if (this.map) {
      const obj2 = this.map(obj);
      return insert(this.collection, obj2, this.idName);
    } else {
      return insert(this.collection, obj, this.idName);
    }
  }
}
export class MongoUpdater<T> {
  constructor(protected collection: Collection, protected idName: string, protected map?: (v: T) => T) {
    this.write = this.write.bind(this);
  }
  write(obj: T): Promise<number> {
    if (this.map) {
      const obj2 = this.map(obj);
      return update(this.collection, obj2, this.idName);
    } else {
      return update(this.collection, obj, this.idName);
    }
  }
}
export class MongoPatcher<T> {
  constructor(protected collection: Collection, protected idName: string, protected map?: (v: T) => T) {
    this.write = this.write.bind(this);
  }
  write(obj: T): Promise<number> {
    if (this.map) {
      const obj2 = this.map(obj);
      return patch(this.collection, obj2, this.idName);
    } else {
      return patch(this.collection, obj, this.idName);
    }
  }
}
export class MongoUpserter<T> {
  constructor(protected collection: Collection, protected idName: string, protected map?: (v: T) => T) {
    this.write = this.write.bind(this);
  }
  write(obj: T): Promise<number> {
    if (this.map) {
      const obj2 = this.map(obj);
      return upsert(this.collection, obj2, this.idName);
    } else {
      return upsert(this.collection, obj, this.idName);
    }
  }
}
