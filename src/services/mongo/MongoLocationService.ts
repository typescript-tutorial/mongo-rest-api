import { Collection, Db, FilterQuery } from 'mongodb';
import { Location } from '../../models/Location';
import { Model } from './metadata';
import { findOne, findWithMap, fromPoint, fromPoints } from './mongo';

export const locationModel: Model = {
  name: 'location',
  attributes: {
    id: {
      key: true
    },
    locationName: {
      required: true,
    },
    type: {
      match: 'equal',
      required: true
    }
  }
};

export class MongoLocationService {
  private readonly collection: Collection;
  private readonly id = 'id';
  constructor(db: Db) {
    this.collection = db.collection('location');
  }
  all(): Promise<Location[]> {
    return findWithMap<Location>(this.collection, {}, this.id).then(v => fromPoints(v, 'location'));
  }
  load(id: string): Promise<Location> {
    const query: FilterQuery<any> = { _id:  id};
    return findOne<Location>(this.collection, query, this.id).then(v => fromPoint(v, 'location', 'latitude', 'longitude'));
  }
}
