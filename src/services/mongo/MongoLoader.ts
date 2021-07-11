import {ObjectId} from 'bson';
import {Collection} from 'mongodb';
import {Attributes, build} from './metadata';
import {count, findOne, findWithMap, StringMap} from './mongo';

export class MongoLoader<T, ID> {
  protected attributes: Attributes;
  protected idName?: string;
  protected idObjectId?: boolean;
  protected map?: StringMap;

  constructor(protected collection: Collection, attributes: Attributes|string, protected mp?: (v: T) => T) {
    if (typeof attributes === 'string') {
      this.idName = attributes;
    } else {
      this.attributes = attributes;
      const meta = build(attributes);
      this.idName = meta.id;
      this.idObjectId = meta.objectId;
      this.map = meta.map;
    }
    this.id = this.id.bind(this);
    this.metadata = this.metadata.bind(this);
    this.all = this.all.bind(this);
    this.load = this.load.bind(this);
    this.exist = this.exist.bind(this);
  }
  id(): string {
    return this.idName;
  }
  metadata(): Attributes {
    return this.attributes;
  }
  all(): Promise<T[]> {
    if (this.mp) {
      return findWithMap<T>(this.collection, {}, this.idName, this.map).then(v => v.map(o => this.mp(o)));
    } else {
      return findWithMap<T>(this.collection, {}, this.idName, this.map);
    }
  }
  load(id: ID): Promise<T> {
    const query: any = { _id: (this.idObjectId ? new ObjectId('' + id) : '' + id) };
    if (this.mp) {
      return findOne<T>(this.collection, query, this.idName, this.map).then(v => this.mp(v));
    } else {
      return findOne<T>(this.collection, query, this.idName, this.map);
    }
  }
  exist(id: ID): Promise<boolean> {
    const query = { _id: (this.idObjectId ? new ObjectId('' + id) : '' + id) };
    return count(this.collection, query).then(c => c > 0);
  }
}
