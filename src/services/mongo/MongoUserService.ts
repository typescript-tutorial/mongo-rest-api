import {Collection, Db, FilterQuery} from 'mongodb';
import {User} from '../../models/User';
import {deleteById, findOne, findWithMap, insert, patch, update} from './mongo';
import { MongoLoader } from './MongoLoader';

export class MongoUserService extends MongoLoader <User, string> {
  // private readonly collection: Collection;
  private readonly id2 = 'id';
  constructor(db: Db) {
    super(db.collection('users'), 'id');
    // this.collection = db.collection('users');
    // this.load = this.load.bind(this);
  }

  all(): Promise<User[]> {
    return findWithMap<User>(this.collection, {}, this.id2);
  }
  load(id: string): Promise<User> {
    const query: FilterQuery<any> = { _id:  id};
    return findOne<User>(this.collection, query, this.id2);
  }
  insert(user: User): Promise<number> {
    return insert(this.collection, user, this.id2);
  }
  update(user: User): Promise<number> {
    return update(this.collection, user, this.id2);
  }
  patch(user: User): Promise<number> {
    return patch(this.collection, user, this.id2);
  }
  delete(id: string): Promise<number> {
    return deleteById(this.collection, id);
  }
}
