import {Request, Response} from 'express';
import {LoadController, ViewService} from './LoadController';
import {Attribute, Attributes} from './metadata';
import {handleError} from './response';
import {fromRequest, getLimit, initializeConfig, jsonResult, SearchConfig, SearchModel, SearchResult} from './search';

export class LoadSearchController<T, ID, S extends SearchModel> extends LoadController<T, ID> {
  config?: SearchConfig;
  quick?: boolean;
  constructor(log: (msg: any, ctx?: any) => void, public find: (s: S, limit?: number, skip?: number, ctx?: any) => Promise<SearchResult<T>>, viewService: ViewService<T, ID> | ((id: ID, ctx?: any) => Promise<T>), keys?: Attributes|Attribute[]|string[], config?: SearchConfig|boolean, public format?: (s: S) => S) {
    super(log, viewService, keys);
    this.search = this.search.bind(this);
    if (config) {
      if (typeof config === 'boolean') {
        this.quick = config;
      } else {
        this.config = initializeConfig(config);
        this.quick = config.quick;
      }
    }
  }
  search(req: Request, res: Response) {
    const s = fromRequest<S>(req, this.format);
    const l = getLimit(s);
    this.find(s, l.limit, l.skip)
      .then(result => jsonResult(res, result, this.quick, s.fields, this.config))
      .catch(err => handleError(err, res, this.log));
  }
}
