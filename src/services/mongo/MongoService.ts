import {Db} from 'mongodb';
import {getCollectionName, Model} from './metadata';
import {PointMapper} from './mongo';
import {MongoWriter} from './MongoWriter';
import {buildQuery} from './query';
import {buildSearchResult, buildSort, SearchResult} from './search';

export class MongoService<T, ID, S> extends MongoWriter<T, ID> {
  public sort: string;
  constructor(public db: Db, public model: Model) {
    super(db.collection(getCollectionName(model)), model.attributes);
    this.sort = (model.sort && model.sort.length > 0 ? model.sort : 'sort');
    if (model.geo && model.latitude && model.longitude && model.geo.length > 0 && model.latitude.length > 0 && model.longitude.length > 0) {
      const mapper = new PointMapper<T>(model.geo, model.latitude, model.longitude);
      this.fromBson = mapper.fromPoint;
      this.toBson = mapper.toPoint;
    }
    this.search = this.search.bind(this);
  }
  search(s: S, limit?: number, skip?: number, fields?: string[]): Promise<SearchResult<T>> {
    const st = (this.sort ? this.sort : 'sort');
    const sn = s[st] as string;
    const so = buildSort(sn, this.attributes);
    delete s[st];
    const query = buildQuery(s, this.attributes);
    return buildSearchResult<T>(this.collection, query, so, limit, skip, fields, this.id, this.map, this.fromBson);
  }
}
