import {Collection} from 'mongodb';
import {Attributes, getVersion} from './metadata';
import {deleteById, insert, mapOne, patch, patchWithFilter, revertOne, update, updateWithFilter, upsert, upsertWithFilter} from './mongo';
import {MongoLoader} from './MongoLoader';

export class MongoWriter<T, ID> extends MongoLoader<T, ID> {
  version: string;
  constructor(collection: Collection, attributes: Attributes|string, protected toBson?: (v: T) => T, fromBson?: (v: T) => T) {
    super(collection, attributes, fromBson);
    if (typeof attributes !== 'string') {
      this.version = getVersion(attributes);
    }
    this.insert = this.insert.bind(this);
    this.update = this.update.bind(this);
    this.patch = this.patch.bind(this);
    this.save = this.save.bind(this);
    this.delete = this.delete.bind(this);
  }
  insert(obj: T): Promise<number> {
    if (this.version && this.version.length > 0) {
      obj[this.version] = 1;
    }
    return insert(this.collection, obj, this.id, true, this.toBson, this.fromBson);
  }
  update(obj: T): Promise<number> {
    if (!this.version) {
      return update(this.collection, obj, this.id, this.toBson, this.fromBson);
    } else {
      const version = obj[this.version];
      if (!version || typeof version !== 'number') {
        return update(this.collection, obj, this.id, this.toBson, this.fromBson);
      } else {
        if (this.id) {
          revertOne(obj, this.id);
        }
        if (!obj['_id']) {
          return Promise.reject(new Error('Cannot update an object that do not have _id field: ' + JSON.stringify(obj)));
        }
        obj[this.version] = 1 + version;
        const filter: any = {_id: obj['_id'], version};
        return updateWithFilter(this.collection, obj, filter, this.toBson, this.fromBson).then(r => {
          mapOne(obj, this.id, this.map);
          return (r > 0 ? r : -1);
        });
      }
    }
  }
  patch(obj: T): Promise<number> {
    if (!this.version) {
      return patch(this.collection, obj, this.id, this.toBson, this.fromBson);
    } else {
      const version = obj[this.version];
      if (!version || typeof version !== 'number') {
        return patch(this.collection, obj, this.id, this.toBson, this.fromBson);
      } else {
        if (this.id) {
          revertOne(obj, this.id);
        }
        if (!obj['_id']) {
          return Promise.reject(new Error('Cannot patch an object that do not have _id field: ' + JSON.stringify(obj)));
        }
        obj[this.version] = 1 + version;
        const filter: any = {_id: obj['_id'], version};
        return patchWithFilter(this.collection, obj, filter, this.toBson, this.fromBson).then(r => {
          mapOne(obj, this.id, this.map);
          return (r > 0 ? r : -1);
        });
      }
    }
  }
  save(obj: T): Promise<number> {
    if (!this.version) {
      return upsert(this.collection, obj, this.id, this.toBson, this.fromBson);
    } else {
      const version = obj[this.version];
      if (!version || typeof version !== 'number') {
        return upsert(this.collection, obj, this.id, this.toBson, this.fromBson);
      } else {
        if (this.id) {
          revertOne(obj, this.id);
        }
        if (!obj['_id']) {
          obj[this.version] = 1;
          return insert(this.collection, obj, undefined, true, this.toBson, this.fromBson);
        } else {
          obj[this.version] = 1 + version;
          const filter: any = {_id: obj['_id'], version};
          return upsertWithFilter(this.collection, obj, filter, this.toBson, this.fromBson).then(r => {
            mapOne(obj, this.id, this.map);
            return (r > 0 ? r : -1);
          });
        }
      }
    }
  }
  delete(id: ID): Promise<number> {
    return deleteById(this.collection, id);
  }
}
