import {Request, Response} from 'express';
import {handleError} from './response';
import {fromRequest, getLimit, initializeConfig, jsonResult, SearchConfig, SearchModel, SearchResult} from './search';

export class SearchController<T, S extends SearchModel> {
  config?: SearchConfig;
  csv?: boolean;
  constructor(protected log: (msg: any, ctx?: any) => void, public find: (s: S, limit?: number, skip?: number, refId?: string) => Promise<SearchResult<T>>, config?: SearchConfig|boolean, public format?: (s: S) => S) {
    this.search = this.search.bind(this);
    if (config) {
      if (typeof config === 'boolean') {
        this.csv = config;
      } else {
        this.config = initializeConfig(config);
        if (this.config) {
          this.csv = this.config.csv;
        }
      }
    }
  }
  search(req: Request, res: Response) {
    const s = fromRequest<S>(req, this.format);
    const l = getLimit(s);
    this.find(s, l.limit, l.skip, l.refId)
      .then(result => jsonResult(res, result, this.csv, s.fields, this.config))
      .catch(err => handleError(err, res, this.log));
  }
}
