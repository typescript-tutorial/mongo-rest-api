import { LocationController } from 'controllers/LocationController';
import { Collection, Db, FilterQuery } from 'mongodb';
import { Location } from '../../models/Location';
import { Model } from './metadata';
import { findOne, findWithMap, fromPoint, fromPoints, PointMapper } from './mongo';
import { MongoWriter } from './MongoWriter';

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
    },
    version: {
      type: 'integer',
      version: true,
    }
  }
};

export class MongoLocationService extends MongoWriter<Location, string> {
  // private readonly collection: Collection;
  // private readonly id = 'id';
  constructor(collection: Collection, mapper: PointMapper<Location>) {
    super(collection, locationModel.attributes, mapper.toPoint, mapper.fromPoint);
  }
  /*
  all(): Promise<Location[]> {
    return findWithMap<Location>(this.collection, {}, this.id).then(v => fromPoints(v, 'location'));
  }
  */
  load(id: string): Promise<Location> {
    const query: FilterQuery<any> = { _id: id};
    return findOne<Location>(this.collection, query, this.id).then(v => fromPoint(v, 'location', 'latitude', 'longitude'));
  }
}
