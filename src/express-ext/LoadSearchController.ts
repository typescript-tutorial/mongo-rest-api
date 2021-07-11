import {Request, Response} from 'express';
import {LoadController, ViewService} from './LoadController';
import {Attribute, Attributes} from './metadata';
import {handleError} from './response';
import {format, fromRequest, getParameters, initializeConfig, jsonResult, Metadata, SearchConfig, SearchModel, SearchResult} from './search';
import {getMetadataFunc} from './search_func';

export class LoadSearchController<T, ID, S extends SearchModel> extends LoadController<T, ID> {
  config?: SearchConfig;
  csv?: boolean;
  dates?: string[];
  numbers?: string[];
  constructor(log: (msg: any, ctx?: any) => void, public find: (s: S, limit?: number, skip?: number|string, fields?: string[]) => Promise<SearchResult<T>>, viewService: ViewService<T, ID> | ((id: ID, ctx?: any) => Promise<T>), keys?: Attributes|Attribute[]|string[], config?: SearchConfig|boolean, dates?: string[], numbers?: string[]) {
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
    const m = getMetadataFunc(viewService, dates, numbers, keys);
    this.dates = m.dates;
    this.numbers = m.numbers;
  }
  search(req: Request, res: Response) {
    const s = fromRequest<S>(req);
    const l = getParameters(s);
    const s2 = format(s, this.dates, this.numbers);
    this.find(s2, l.limit, l.skipOrRefId, l.fields)
      .then(result => jsonResult(res, result, this.csv, s.fields, this.config))
      .catch(err => handleError(err, res, this.log));
  }
}
