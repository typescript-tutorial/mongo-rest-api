import {Collection, Db, FilterQuery} from 'mongodb';
import {User} from '../../models/User';
import {deleteById, findOne, findWithMap, insert, patch, update} from './mongo';

export class MongoUserService {
  private readonly collection: Collection;
  private readonly id = 'id';
  constructor(db: Db) {
    this.collection = db.collection('users');
  }

  all(): Promise<User[]> {
    return findWithMap<User>(this.collection, {}, this.id);
  }
  load(id: string): Promise<User> {
    const query: FilterQuery<any> = { _id:  id};
    return findOne<User>(this.collection, query, this.id);
  }
  insert(user: User): Promise<number> {
    return insert(this.collection, user, this.id);
  }
  update(user: User): Promise<number> {
    return update(this.collection, user, this.id);
  }
  patch(user: User): Promise<number> {
    return patch(this.collection, user, this.id);
  }
  delete(id: string): Promise<number> {
    return deleteById(this.collection, id);
  }
}
