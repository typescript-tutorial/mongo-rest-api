import {Request, Response} from 'express';
import {LoadController, ViewService} from './LoadController';
import {Attribute, Attributes} from './metadata';
import {handleError} from './response';
import {fromRequest, getLimit, initializeConfig, jsonResult, SearchConfig, SearchModel, SearchResult} from './search';

export class LoadSearchController<T, ID, S extends SearchModel> extends LoadController<T, ID> {
  config?: SearchConfig;
  csv?: boolean;
  constructor(log: (msg: any, ctx?: any) => void, public find: (s: S, limit?: number, skip?: number, refId?: string) => Promise<SearchResult<T>>, viewService: ViewService<T, ID> | ((id: ID, ctx?: any) => Promise<T>), keys?: Attributes|Attribute[]|string[], config?: SearchConfig|boolean, public format?: (s: S) => S) {
    super(log, viewService, keys);
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
