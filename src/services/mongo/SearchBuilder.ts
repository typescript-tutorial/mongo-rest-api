import {Collection, FilterQuery, SortOptionObject} from 'mongodb';
import {Attributes, build} from './metadata';
import {StringMap} from './mongo';
import {buildSearchResult, buildSort as bs, SearchResult} from './search';

export class SearchBuilder<T, S> {
  metadata?: Attributes;
  idName?: string;
  map?: StringMap;
  buildSort?: (s: string, m?: Attributes|StringMap) => SortOptionObject<T>;
  constructor(public collection: Collection,
    public buildQuery: (s: S, m?: Attributes) => FilterQuery<T>,
    metadata: Attributes|string,
    public mp?: (v: T) => T,
    public sort?: string,
    buildSort?: (s: string, m?: Attributes|StringMap) => SortOptionObject<T>) {
      if (metadata) {
        if (typeof metadata === 'string') {
          this.idName = metadata;
        } else {
          this.metadata = metadata;
          const meta = build(metadata);
          this.idName = meta.id;
          this.map = meta.map;
        }
      }
      this.buildSort = (buildSort ? buildSort : bs);
      this.search = this.search.bind(this);
    }
  search(s: S, limit?: number, skip?: number, fields?: string[]): Promise<SearchResult<T>> {
    const st = (this.sort ? this.sort : 'sort');
    const sn = s[st] as string;
    const so = this.buildSort(sn, this.metadata);
    delete s[st];
    const query = this.buildQuery(s, this.metadata);
    return buildSearchResult<T>(this.collection, query, so, limit, skip, fields, this.idName, this.map, this.mp);
  }
}
