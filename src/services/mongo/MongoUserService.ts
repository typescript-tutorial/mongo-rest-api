import {Collection, Db, FilterQuery} from 'mongodb';
import {User} from '../../models/User';
import {Model} from './metadata';
import {deleteById, findOne, findWithMap, insert, patch, update} from './mongo';
import { MongoLoader } from './MongoLoader';
import { MongoWriter } from './MongoWriter';

export const userModel: Model = {
  name: 'user',
  attributes: {
    id: {
      key: true
    },
    username: {
      match: 'contain'
    },
    email: {
      format: 'email',
      required: true
    },
    phone: {
      format: 'phone',
      required: true
    },
    dateOfBirth: {
      type: 'datetime'
    }
  }
};

export class MongoUserService extends MongoWriter<User, string> {
  // private readonly collection: Collection;
  private readonly id2 = 'id';
  constructor(collection: Collection) {
    super(collection, userModel.attributes);
    // this.collection = db.collection('users');
    // this.load = this.load.bind(this);
    this.insert = this.insert.bind(this);
    this.update = this.update.bind(this);
    this.patch = this.patch.bind(this);
    this.delete = this.delete.bind(this);
  }
  /*
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
  */
}
