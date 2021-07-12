import {Collection} from 'mongodb';
import {insert, patch, update, upsert} from './mongo';

export class MongoInserter<T> {
  constructor(protected collection: Collection, protected id: string, protected map?: (v: T) => T) {
    this.write = this.write.bind(this);
  }
  write(obj: T): Promise<number> {
    return insert(this.collection, obj, this.id, false, this.map);
  }
}
export class MongoUpdater<T> {
  constructor(protected collection: Collection, protected id: string, protected map?: (v: T) => T) {
    this.write = this.write.bind(this);
  }
  write(obj: T): Promise<number> {
    return update(this.collection, obj, this.id, this.map);
  }
}
export class MongoPatcher<T> {
  constructor(protected collection: Collection, protected id: string, protected map?: (v: T) => T) {
    this.write = this.write.bind(this);
  }
  write(obj: T): Promise<number> {
    return patch(this.collection, obj, this.id, this.map);
  }
}
export class MongoUpserter<T> {
  constructor(protected collection: Collection, protected id: string, protected map?: (v: T) => T) {
    this.write = this.write.bind(this);
  }
  write(obj: T): Promise<number> {
    return upsert(this.collection, obj, this.id, this.map);
  }
}
