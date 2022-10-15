import { Collection, Db, Document, Filter, ModifyResult, MongoClient, MongoClientOptions, OptionalId, SchemaMember, Sort } from 'mongodb';

export interface MongoConfig {
  uri: string;
  db: string;
  auth_source?: string;
  pool_size?: number;
}
export interface StringMap {
  [key: string]: string;
}
export function connectToDb(uri: string, db: string, authSource: string = 'admin', maxPoolSize: number = 5): Promise<Db> {
  const options: MongoClientOptions = { authSource, maxPoolSize };
  return connect(uri, options).then(client => client.db(db));
}
export function connect(uri: string, options: MongoClientOptions): Promise<MongoClient> {
  return new Promise<MongoClient>((resolve, reject) => {
    MongoClient.connect(uri, options).then((client) => {
      console.log('Connected successfully to MongoDB.');
      resolve(client);
    }).catch((err) => {
      console.log('Failed to connect to MongoDB.');
      reject(err);
    })
  });
}
export function findWithMap<T>(collection: Collection, query: Filter<T>, id?: string, m?: StringMap, sort?: Sort, limit?: number, skip?: number, project?: any): Promise<T[]> {
  return find<T>(collection, query, sort, limit, skip, project).then(objects => {
    for (const obj of objects) {
      if (id && id !== '') {
        (obj as any)[id] = (obj as any)['_id'];
        delete (obj as any)['_id'];
      }
    }
    if (!m) {
      return objects;
    } else {
      return mapArray(objects, m);
    }
  });
}
export function find<T>(collection: Collection,
  query: Filter<T>,
  sort?: Sort,
  limit?: number, skip?: number,
  project?: Document): Promise<T[]> {
  return new Promise<T[]>((resolve, reject) => {
    let cursor = collection.find(query);
    if (sort) {
      cursor = cursor.sort(sort);
    }
    if (limit) {
      cursor = cursor.limit(limit);
    }
    if (skip) {
      cursor = cursor.skip(skip);
    }
    if (project) {
      cursor = cursor.project(project);
    }
    cursor.toArray().then(items => {
      resolve(items as any)
    }).catch(err => reject(err))
  });
}
export async function findOne<T>(collection: Collection, query: Filter<T>, idName?: string, m?: StringMap): Promise<T> {
  const obj = await _findOne<T>(collection, query);
  return mapOne(obj, idName, m);
}
function _findOne<T>(collection: Collection, query: Filter<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // collection.findOne(query, (err, item: T) => err ? reject(err) : resolve(item));
    collection.findOne(query).then(item => resolve(item as any)).catch(err => reject(err))
  });
}
export function insert<T>(collection: Collection, obj: OptionalId<T>, id?: string, handleDuplicate?: boolean, toBson?: (v: OptionalId<T>) => OptionalId<T>, fromBson?: (v: OptionalId<T>) => OptionalId<T>): Promise<number> {
  obj = revertOne(obj, id);
  if (toBson) {
    obj = toBson(obj);
  }
  return collection.insertOne(obj).then(value => {
    mapOne(obj, id);
    if (toBson && fromBson) {
      fromBson(obj);
    }
    return value.acknowledged ? 1 : 0;
  })
    .catch(err => {
      mapOne(obj, id);
      if (toBson && fromBson) {
        fromBson(obj);
      }
      if (handleDuplicate && err && (err as any).errmsg) {
        if ((err as any).errmsg.indexOf('duplicate key error collection:') >= 0) {
          if ((err as any).errmsg.indexOf('dup key: { _id:') >= 0) {
            return 0;
          } else {
            return -1;
          }
        }
      }
      throw err;
    });


}
export function patch<T>(collection: Collection, obj: T, id?: string, toBson?: (v: T) => T, fromBson?: (v: T) => T): Promise<number> {
  return new Promise<number>(((resolve, reject) => {
    revertOne(obj, id);
    if (!(obj as any)['_id']) {
      return reject(new Error('Cannot patch an object that do not have _id field: ' + JSON.stringify(obj)));
    }
    if (toBson) {
      obj = toBson(obj);
    }
    collection.findOneAndUpdate({ _id: (obj as any)['_id'] }, { $set: obj as any })
      .then(result => {
        mapOne(obj, id);
        if (toBson && fromBson) {
          fromBson(obj);
        }
        resolve(getAffectedRow(result));
      }).catch(err => {
        reject(err);
      });
  }));
}
export function getAffectedRow<T>(result: ModifyResult<T>): number {
  if (result.lastErrorObject) {
    return result.lastErrorObject.n;
  } else {
    return (result.ok ? result.ok : 0);
  }
}
export function update<T>(collection: Collection, obj: T, id?: string, toBson?: (v: T) => T, fromBson?: (v: T) => T): Promise<number> {
  return new Promise<number>(((resolve, reject) => {
    revertOne(obj, id);
    if (!(obj as any)['_id']) {
      return reject(new Error('Cannot update an object that do not have _id field: ' + JSON.stringify(obj)));
    }
    if (toBson) {
      obj = toBson(obj);
    }
    collection.findOneAndReplace({ _id: (obj as any)['_id'] }, (obj as any)).then((result) => {
      mapOne(obj, id);
      if (toBson && fromBson) {
        fromBson(obj);
      }
      resolve(getAffectedRow(result));
    }).catch(err => {
      reject(err);
    });

  }));
}
export function deleteById(collection: Collection, _id: any): Promise<number> {
  return new Promise<number>(((resolve, reject) => {
    if (!_id) {
      return resolve(0);
    }
    collection.deleteOne({ _id }).then(result => resolve(result.deletedCount ?? 0)).catch(err => reject(err));
  }));
}
export function revertOne(obj: any, idName?: string): any {
  if (idName && idName.length > 0) {
    obj['_id'] = obj[idName];
    delete obj[idName];
  }
  return obj;
}
export function mapOne(obj: any, idName?: string, m?: StringMap): any {
  if (!obj || !idName) {
    return obj;
  }
  if (idName && idName.length > 0) {
    obj[idName] = obj['_id'];
    delete obj['_id'];
  }
  if (m) {
    return _mapOne(obj, m);
  } else {
    return obj;
  }
}
export function _mapOne<T>(obj: T, m: StringMap): any {
  const obj2: any = {};
  const keys = Object.keys(obj as Object);
  for (const key of keys) {
    let k0 = m[key];
    if (!k0) {
      k0 = key;
    }
    obj2[k0] = (obj as any)[key];
  }
  return obj2;
}
export function mapArray<T>(results: T[], m?: StringMap): T[] {
  if (!m) {
    return results;
  }
  const mkeys = Object.keys(m);
  if (mkeys.length === 0) {
    return results;
  }
  const objs = [];
  const length = results.length;
  for (let i = 0; i < length; i++) {
    const obj = results[i];
    const obj2: any = {};
    const keys = Object.keys(obj as Object);
    for (const key of keys) {
      let k0 = m[key];
      if (!k0) {
        k0 = key;
      }
      obj2[k0] = (obj as any)[key];
    }
    objs.push(obj2);
  }
  return objs;
}
