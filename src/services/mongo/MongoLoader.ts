import {ObjectId} from 'bson';
import {Collection} from 'mongodb';
import {Attributes, build} from './metadata';
import {count, findOne, findWithMap, StringMap} from './mongo';

export class MongoLoader<T, ID> {
  id?: string;
  protected attributes: Attributes;
  protected idObjectId?: boolean;
  protected map?: StringMap;

  constructor(protected collection: Collection, attributes: Attributes|string, protected fromBson?: (v: T) => T) {
    if (typeof attributes === 'string') {
      this.id = attributes;
    } else {
      this.attributes = attributes;
      const meta = build(attributes);
      this.id = meta.id;
      this.idObjectId = meta.objectId;
      this.map = meta.map;
    }
    this.metadata = this.metadata.bind(this);
    this.all = this.all.bind(this);
    this.load = this.load.bind(this);
    this.exist = this.exist.bind(this);
  }
  metadata(): Attributes {
    return this.attributes;
  }
  all(): Promise<T[]> {
    if (this.fromBson) {
      return findWithMap<T>(this.collection, {}, this.id, this.map).then(v => v.map(o => this.fromBson(o)));
    } else {
      return findWithMap<T>(this.collection, {}, this.id, this.map);
    }
  }
  load(id: ID): Promise<T> {
    const query: any = { _id: (this.idObjectId ? new ObjectId('' + id) : '' + id) };
    if (this.fromBson) {
      return findOne<T>(this.collection, query, this.id, this.map).then(v => this.fromBson(v));
    } else {
      return findOne<T>(this.collection, query, this.id, this.map);
    }
  }
  exist(id: ID): Promise<boolean> {
    const query = { _id: (this.idObjectId ? new ObjectId('' + id) : '' + id) };
    return count(this.collection, query).then(c => c > 0);
  }
}
