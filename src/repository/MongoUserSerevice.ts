import {Collection, Db, FindAndModifyWriteOpResultObject} from 'mongodb';
import {UserInfo} from '../auth/model/UserInfo';
import {UserInfoService} from '../auth/service/UserInfoService';

export class MongoUserInfoService implements UserInfoService {
  constructor(
    private db: Db,
    private userCollection: string,
    private authenticationCollection: string,
    private successTimeName: string,
    private failTimeName: string,
    private failCountName: string,
    private lockedUntilTimeName: string
  ) {
  }
  async getUserInfo(username: string): Promise<UserInfo> {
    const filter = {username};
    const user: User = await this.db.collection(this.userCollection).findOne(filter);
    if (!user) {
      return null;
    }
    const auth: any = await this.authenticationRepository.load(user.userId);
    const userInfo: UserInfo = {
      userId: user.userId,
      username: user.username,
      email: user.email,
      disable: user.disable,
      maxPasswordAge: user.maxPasswordAge,
      displayName: user.displayName,
      suspended: (user.status === UserStatus.Suspended),
      deactivated: (user.status === UserStatus.Deactivated)
    };
    if (!!auth) {
      userInfo.password = auth.password;
      userInfo.lockedUntilTime = auth.lockedUntilTime;
      userInfo.successTime = auth.successTime;
      userInfo.failTime = auth.failTime;
      userInfo.failCount = auth.failCount;
      userInfo.passwordModifiedTime = auth.passwordModifiedTime;
    }
    return userInfo;
  }

  async wrongPassword(userId: string, failCount: number, lockedUntil: Date): Promise<boolean> {
    const pass = {
      _id: userId,
    };
    if (this.failTimeName.length > 0) {
      pass[this.failTimeName] = new Date();
    }
    if (this.failCountName.length > 0) {
      pass[this.failCountName] = failCount;
      if (this.lockedUntilTimeName.length > 0) {
        pass[this.lockedUntilTimeName] = lockedUntil;
      }
    }
    const result = await upsert(this.collection, pass);
    if (result > 0) {
      return true;
    }
    return false;
  }

  async passAuthentication(userId: string): Promise<number> {
    const pass = {
      _id: userId,
    };
    if (this.successTimeName.length > 0) {
      pass[this.successTimeName] = new Date();
    }
    if (this.failCountName.length > 0) {
      pass[this.failCountName] = 0;
    }
    if (this.lockedUntilTimeName.length > 0) {
      pass[this.lockedUntilTimeName] = null;
    }
    const result = await upsert(this.collection, pass);
    return result;
  }
}

export function upsert<T>(collection: Collection, object: T, id?: string, toBson?: (v: T) => T, fromBson?: (v: T) => T): Promise<number> {
  let obj: any = revertOne(object, id);
  if (obj['_id']) {
    if (toBson) {
      obj = toBson(obj);
    }
    return new Promise<number>(((resolve, reject) => {
      collection.findOneAndUpdate({ _id: obj['_id'] }, { $set: obj }, {
        upsert: true
      }, (err, result: FindAndModifyWriteOpResultObject<T>) => {
        if (err) {
          reject(err);
        } else {
          if (id) {
            mapOne(obj, id);
          }
          if (toBson && fromBson) {
            fromBson(obj);
          }
          resolve(getAffectedRow(result));
        }
      });
    }));
  } else {
    return collection.insertOne(object).then(r => {
      const v = r['insertedId'];
      if (v && id && id.length > 0) {
        object[id] = v;
      }
      if (fromBson) {
        fromBson(object);
      }
      return r.insertedCount;
    });
  }
}
export function getAffectedRow<T>(result: FindAndModifyWriteOpResultObject<T>): number {
  if (result.lastErrorObject) {
    return result.lastErrorObject.n;
  } else {
    return result.ok;
  }
}
export function revertOne(obj: any, id?: string): any {
  if (id && id.length > 0) {
    obj['_id'] = obj[id];
    delete obj[id];
  }
  return obj;
}
export interface StringMap {
  [key: string]: string;
}
export function mapOne(obj: any, id?: string, m?: StringMap): any {
  if (!obj || !id) {
    return obj;
  }
  if (id && id.length > 0) {
    obj[id] = obj['_id'];
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
    obj2[k0] = obj[key];
  }
  return obj2;
}
