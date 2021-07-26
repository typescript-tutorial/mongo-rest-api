import {Collection, Db, DeleteWriteOpResultObject, FilterQuery, FindAndModifyWriteOpResultObject, MongoClient, MongoClientOptions, ProjectionOperators, SchemaMember, SortOptionObject} from 'mongodb';

export interface MongoConfig {
  uri: string;
  db: string;
  auth_source?: string;
  pool_size?: number;
}
export interface StringMap {
  [key: string]: string;
}
export async function connectToDb(uri: string, db: string, authSource: string = 'admin', poolSize: number = 5): Promise<Db> {
  const options: MongoClientOptions = { useNewUrlParser: true, authSource, poolSize, useUnifiedTopology: true };
  const client = await connect(uri, options);
  return client.db(db);
}
export function connect(uri: string, options: MongoClientOptions): Promise<MongoClient> {
  return new Promise<MongoClient>((resolve, reject) => {
    MongoClient.connect(uri, options, (err, client: MongoClient) => {
      if (err) {
        console.log('Failed to connect to MongoDB.');
        reject(err);
      } else {
        console.log('Connected successfully to MongoDB.');
        resolve(client);
      }
    });
  });
}
export async function findWithMap<T>(collection: Collection, query: FilterQuery<T>, id?: string, m?: StringMap, sort?: string | [string, number][] | SortOptionObject<T>, limit?: number, skip?: number, project?: any): Promise<T[]> {
  const objects = await find<T>(collection, query, sort, limit, skip, project);
  for (const obj of objects) {
    if (id && id !== '') {
      obj[id] = obj['_id'];
      delete obj['_id'];
    }
  }
  if (!m) {
    return objects;
  } else {
    return mapArray(objects, m);
  }
}
export function find<T>(collection: Collection, query: FilterQuery<T>, sort?: string | [string, number][] | SortOptionObject<T>, limit?: number, skip?: number, project?: SchemaMember<T, ProjectionOperators | number | boolean | any>): Promise<T[]> {
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
    cursor.toArray((err, items: T[]) => err ? reject(err) : resolve(items));
  });
}
export function findOne<T>(collection: Collection, query: FilterQuery<T>, idName?: string, m?: StringMap): Promise<T> {
  return _findOne<T>(collection, query).then(obj => mapOne(obj, idName, m));
}
function _findOne<T>(collection: Collection, query: FilterQuery<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    collection.findOne(query, (err, item: T) => err ? reject(err) : resolve(item));
  });
}
export async function insert<T>(collection: Collection, obj: T, idName?: string): Promise<number> {
  try {
    const value = await collection.insertOne(revertOne(obj, idName));
    mapOne(obj, idName);
    return value.insertedCount;
  } catch (err) {
    if (err) {
      if (err.errmsg.indexOf('duplicate key error collection:') >= 0) {
        if (err.errmsg.indexOf('dup key: { _id:') >= 0) {
          return 0;
        } else {
          throw -1;
        }
      }
    }
    throw err;
  }
}
export function patch<T>(collection: Collection, obj: T, idName?: string): Promise<number> {
  return new Promise<number>(((resolve, reject) => {
    revertOne(obj, idName);
    if (!(obj as any)['_id']) {
      return reject(new Error('Cannot updateOne an Object that do not have _id field.'));
    }
    collection.findOneAndUpdate({ _id: (obj as any)['_id'] }, { $set: obj }, { returnOriginal: false }, (err, result: FindAndModifyWriteOpResultObject<T>) => {
      if (err) {
        reject(err);
      } else {
        mapOne(obj, idName);
        resolve(result.ok);
      }
    });
  }));
}
export function update<T>(collection: Collection, obj: T, idName?: string): Promise<number> {
  return new Promise<number>(((resolve, reject) => {
    revertOne(obj, idName);
    if (!(obj as any)['_id']) {
      return reject(new Error('Cannot updateOne an Object that do not have _id field.'));
    }
    collection.findOneAndReplace({ _id: (obj as any)['_id'] }, (obj as any), { returnOriginal: false }, (err, result: FindAndModifyWriteOpResultObject<T>) => {
      if (err) {
        reject(err);
      } else {
        mapOne(obj, idName);
        resolve(result.ok);
      }
    });
  }));
}
export function deleteById(collection: Collection, _id: any): Promise<number> {
  return new Promise<number>(((resolve, reject) => {
    if (!_id) {
      return resolve(0);
    }
    collection.deleteOne({ _id }, (err, result: DeleteWriteOpResultObject) => err ? reject(err) : resolve(result.deletedCount));
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
  const keys = Object.keys(obj);
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
    const keys = Object.keys(obj);
    for (const key of keys) {
      let k0 = m[key];
      if (!k0) {
        k0 = key;
      }
      obj2[k0] = obj[key];
    }
    objs.push(obj2);
  }
  return objs;
}
