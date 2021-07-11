import {AggregationCursor, BulkWriteOpResultObject, Collection, Db, DeleteWriteOpResultObject, FilterQuery, FindAndModifyWriteOpResultObject, MatchKeysAndValues, MongoClient, MongoClientOptions, ProjectionOperators, PullOperator, PushOperator, SchemaMember, SortOptionObject} from 'mongodb';

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
export function findOne<T>(collection: Collection, query: FilterQuery<T>, idName?: string, m?: StringMap): Promise<T> {
  return _findOne<T>(collection, query).then(obj => mapOne(obj, idName, m));
}
function _findOne<T>(collection: Collection, query: FilterQuery<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    collection.findOne(query, (err, item: T) => err ? reject(err) : resolve(item));
  });
}
export function getFields<T>(collection: Collection, field: string, values: T[], noSort?: boolean): Promise<T[]> {
  const query: any = {};
  query[field] = { $in: values };
  const project: any = {};
  project[field] = 1;
  let sort: any;
  if (!noSort) {
    sort = {};
    sort[field] = 1;
  }
  return find(collection, query, sort, undefined, undefined, project).then(v => {
    const r: T[] = [];
    for (const s of v) {
      r.push(s[field]);
    }
    return r;
  });
}
export async function findWithMap<T>(collection: Collection, query: FilterQuery<T>, idName?: string, m?: StringMap, sort?: string | [string, number][] | SortOptionObject<T>, limit?: number, skip?: number, project?: any): Promise<T[]> {
  const objects = await find<T>(collection, query, sort, limit, skip, project);
  for (const obj of objects) {
    if (idName && idName !== '') {
      obj[idName] = obj['_id'];
    }
    delete obj['_id'];
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

export async function insert<T>(collection: Collection, obj: T, idName?: string, handleDuplicate?: boolean): Promise<number> {
  try {
    const value = await collection.insertOne(revertOne(obj, idName));
    mapOne(obj, idName);
    return value.insertedCount;
  } catch (err) {
    if (handleDuplicate && err && err.errmsg) {
      if (err.errmsg.indexOf('duplicate key error collection:') >= 0) {
        if (err.errmsg.indexOf('dup key: { _id:') >= 0) {
          return 0;
        } else {
          return -1;
        }
      }
    }
    throw err;
  }
}
export async function insertMany<T>(collection: Collection, objs: T[], idName?: string): Promise<number> {
  try {
    const value = await collection.insertMany(revertArray(objs, idName));
    if (idName) {
      for (let i = 0; i < value.ops.length; i++) {
        (objs[i] as any)[idName] = value.ops[i]['_id'];
        delete (objs[i] as any)['_id'];
      }
    }
    return value.insertedCount;
  } catch (err) {
    if (err) {
      if (err.errmsg.indexOf('duplicate key error collection:') >= 0) {
        if (err.errmsg.indexOf('dup key: { _id:') >= 0) {
          return 0;
        } else {
          return -1;
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
      return reject(new Error('Cannot patch an object that do not have _id field: ' + JSON.stringify(obj)));
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
export function patchWithFilter<T>(collection: Collection, obj: T, filter: FilterQuery<T>): Promise<number> {
  return new Promise<number>(((resolve, reject) => {
    collection.findOneAndUpdate(filter, { $set: obj }, { returnOriginal: false }, (err, result: FindAndModifyWriteOpResultObject<T>) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.ok);
      }
    });
  }));
}
export function update<T>(collection: Collection, obj: T, idName?: string): Promise<number> {
  return new Promise<number>(((resolve, reject) => {
    revertOne(obj, idName);
    if (!(obj as any)['_id']) {
      return reject(new Error('Cannot update an object that do not have _id field: ' + JSON.stringify(obj)));
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
export function updateWithFilter<T>(collection: Collection, obj: T, filter: FilterQuery<T>): Promise<number> {
  return new Promise<number>(((resolve, reject) => {
    collection.findOneAndReplace(filter, (obj as any), { returnOriginal: false }, (err, result: FindAndModifyWriteOpResultObject<T>) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.ok);
      }
    });
  }));
}
export function updateFields<T>(collection: Collection, object: T, arr: PushOperator<T>, idName?: string): Promise<T> {
  return new Promise<T>(((resolve, reject) => {
    const obj: any = revertOne(object, idName);
    if (!obj['_id']) {
      return reject(new Error('Cannot update an object that do not have _id field: ' + JSON.stringify(obj)));
    }
    collection.findOneAndUpdate({ _id: obj['_id'] }, { $push: arr }, { returnOriginal: false }, (err, result: FindAndModifyWriteOpResultObject<T>) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(result.value);
      }
    });
  }));
}
export function updateByQuery<T>(collection: Collection, query: FilterQuery<T>, setValue: MatchKeysAndValues<T>): Promise<T> {
  return new Promise<T>(((resolve, reject) => {
    collection.findOneAndUpdate(query, { $set: setValue }, { returnOriginal: false }, (err, result: FindAndModifyWriteOpResultObject<T>) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(result.value);
      }
    });
  }));
}
/*
export function updateMany<T>(collection: Collection, filter: FilterQuery<T>, update: UpdateQuery<T> | Partial<T>): Promise<number> {
  return new Promise<number>(((resolve, reject) => {
    collection.updateMany(filter, update, (err, result: UpdateWriteOpResult) => {
      if (err) {
        return reject(err);
      }
      return resolve(result.modifiedCount);
    });
  }));
}
*/
export function updateMany<T>(collection: Collection, objects: T[], idName?: string): Promise<number> {
  return new Promise<number>(((resolve, reject) => {
    const operations = [];
    revertArray(objects, idName);
    for (const object of objects) {
      const obj: any = object;
      if (obj['_id']) {
        operations.push({
          updateOne: {
            filter: { _id: obj['_id'] },
            update: { $set: obj },
          },
        });
      }
    }

    if (operations.length === 0) {
      return resolve(0);
    }
    collection.bulkWrite(operations, (err, result: BulkWriteOpResultObject) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(result.modifiedCount);
      }
    });
  }));
}
export function upsert<T>(collection: Collection, object: T, idName?: string): Promise<number> {
  const obj: any = revertOne(object, idName);
  if (obj['_id']) {
    return new Promise<number>(((resolve, reject) => {
      collection.findOneAndUpdate({ _id: obj['_id'] }, { $set: obj }, {
        upsert: true,
        returnOriginal: false,
      }, (err, result: FindAndModifyWriteOpResultObject<T>) => {
        if (err) {
          reject(err);
        } else {
          if (idName) {
            mapOne(obj, idName);
          }
          resolve(result.ok);
        }
      });
    }));
  } else {
    return insert(collection, object);
  }
}
export function upsertWithFilter<T>(collection: Collection, obj: T, filter: FilterQuery<T>): Promise<number> {
  return new Promise<number>(((resolve, reject) => {
    collection.findOneAndUpdate(filter, { $set: obj }, {
      upsert: true,
      returnOriginal: false,
    }, (err, result: FindAndModifyWriteOpResultObject<T>) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.ok);
      }
    });
  }));
}
export function upsertMany<T>(collection: Collection, objects: T[], idName?: string): Promise<number> {
  return new Promise<number>(((resolve, reject) => {
    const operations = [];
    revertArray(objects, idName);
    for (const object of objects) {
      if ((object as any)['_id']) {
        operations.push({
          updateOne: {
            filter: { _id: (object as any)['_id'] },
            update: { $set: object },
            upsert: true,
          },
        });
      } else {
        operations.push({
          insertOne: {
            document: object,
          },
        });
      }
    }
    collection.bulkWrite(operations, (err, result: BulkWriteOpResultObject) => {
      if (err) {
        return reject(err);
      }
      return resolve(result.insertedCount + result.modifiedCount + result.upsertedCount);
    });
  }));
}
export function deleteMany<T>(collection: Collection, query: FilterQuery<T>): Promise<number> {
  return new Promise<number>(((resolve, reject) => {
    collection.deleteMany(query, (err, result: DeleteWriteOpResultObject) => err ? reject(err) : resolve(result.deletedCount ? result.deletedCount : 1));
  }));
}
export function deleteOne<T>(collection: Collection, query: FilterQuery<T>): Promise<number> {
  return new Promise<number>(((resolve, reject) => {
    collection.deleteOne(query, (err, result: DeleteWriteOpResultObject) => err ? reject(err) : resolve(result.deletedCount ? result.deletedCount : 1));
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
export function deleteByIds(collection: Collection, _ids: any[]): Promise<number> {
  return new Promise<number>(((resolve, reject) => {
    if (!_ids || _ids.length === 0) {
      return resolve(0);
    }
    const operations = [{
      deleteMany: {
        filter: {
          _id: {
            $in: _ids,
          },
        },
      },
    },
    ];
    collection.bulkWrite(operations, (err, result: BulkWriteOpResultObject) => {
      return err ? reject(err) : resolve(result.deletedCount);
    });
  }));
}
export function deleteFields<T>(collection: Collection, object: T, filter: PullOperator<T>, idName?: string): Promise<number> {
  return new Promise<number>(((resolve, reject) => {
    const obj: any = revertOne(object, idName);
    if (!obj['_id']) {
      return reject(new Error('Cannot delete an object that do not have _id field: ' + JSON.stringify(obj)));
    }
    collection.findOneAndUpdate({ _id: obj['_id'] }, { $pull: filter }, {
      returnOriginal: false,
    }, (err, result: FindAndModifyWriteOpResultObject<T>) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(result.ok);
      }
    });
  }));
}
export function count<T>(collection: Collection, query: FilterQuery<T>): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    collection.countDocuments(query, (err, result) => err ? reject(err) : resolve(result));
  });
}
export function findWithAggregate<T>(collection: Collection, pipeline: object[]): Promise<T[]> {
  return new Promise<T[]>(((resolve, reject) => {
    collection.aggregate(pipeline, (er0, result: AggregationCursor<T>) => {
      if (er0) {
        reject(er0);
      } else {
        result.toArray((er1, items) => er1 ? reject(er1) : resolve(items ? items : []));
      }
    });
  }));
}
export function revertOne(obj: any, idName?: string): any {
  if (idName && idName.length > 0) {
    obj['_id'] = obj[idName];
    delete obj[idName];
  }
  return obj;
}
export function revertArray<T>(objs: T[], idName?: string): T[] {
  if (!objs || !idName) {
    return objs;
  }
  if (idName && idName.length > 0) {
    const length = objs.length;
    for (let i = 0; i < length; i++) {
      const obj: any = objs[i];
      obj['_id'] = obj[idName];
      delete obj[idName];
    }
  }
  return objs;
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
      obj2[k0] = (obj as any)[key];
    }
    objs.push(obj2);
  }
  return objs;
}
export function buildProject<T>(fields: string[], notIncludeId?: boolean): SchemaMember<T, ProjectionOperators | number | boolean | any> {
  if (!fields || fields.length === 0) {
    return undefined;
  }
  const p: any = {};
  for (const s of fields) {
    p[s] = 1;
  }
  if (!notIncludeId) {
    p['_id'] = 1;
  }
  return p;
}
export function fromPoints<T>(s: T[], geo?: string, latitude?: string, longitude?: string): T[] {
  if (!geo) {
    geo = 'geo';
  }
  if (!latitude) {
    latitude = 'latitude';
  }
  if (!longitude) {
    longitude = 'longitude';
  }
  return s.map(o => fromPoint(o, geo, latitude, longitude));
}
export function fromPoint<T>(v: T, geo: string, latitude: string, longitude: string): T {
  if (!v) {
    return v;
  }
  const point: any = v[geo];
  if (!point) {
    return v;
  }
  const coordinates = point['coordinates'];
  if (!coordinates || !Array.isArray(coordinates)) {
    return v;
  }
  if (coordinates.length < 2) {
    return v;
  }
  const lat = coordinates[0];
  const long = coordinates[1];
  if (typeof lat !== 'number' || typeof long !== 'number') {
    return v;
  }
  v[latitude] = lat;
  v[longitude] = long;
  delete v[geo];
  return v;
}
export function toPoints<T>(s: T[], geo?: string, latitude?: string, longitude?: string): T[] {
  if (!geo) {
    geo = 'geo';
  }
  if (!latitude) {
    latitude = 'latitude';
  }
  if (!longitude) {
    longitude = 'longitude';
  }
  return s.map(o => toPoint(o, geo, latitude, longitude));
}
export function toPoint<T>(v: T, geo: string, latitude: string, longitude: string): T {
  if (!v) {
    return v;
  }
  const lat = v[latitude];
  const long = v[longitude];
  if (typeof lat !== 'number' || typeof long !== 'number') {
    return v;
  }
  const point = { type: 'Point', coordinates: [lat, long] };
  v[geo] = point;
  delete v[latitude];
  delete v[longitude];
}

export class PointMapper<T> {
  constructor(public geo?: string, public latitude?: string, public longitude?: string) {
    if (!geo) {
      this.geo = 'geo';
    }
    if (!latitude) {
      this.latitude = 'latitude';
    }
    if (!longitude) {
      this.longitude = 'longitude';
    }
    this.fromPoint = this.fromPoint.bind(this);
    this.toPoint = this.toPoint.bind(this);
  }
  fromPoint(model: T): T {
    return fromPoint(model, this.geo, this.latitude, this.longitude);
  }
  toPoint(model: T): T {
    return toPoint(model, this.geo, this.latitude, this.longitude);
  }
}
