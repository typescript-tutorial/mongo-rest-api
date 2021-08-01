import {Request, Response} from 'express';
import {handleError} from './http';
import {format, fromRequest, getParameters, initializeConfig, jsonResult, SearchConfig, SearchModel, SearchResult} from './search';

export class SearchController<T, S extends SearchModel> {
  config?: SearchConfig;
  csv?: boolean;
  fields?: string;
  excluding?: string;
  constructor(protected log: (msg: any, ctx?: any) => void, public find: (s: S, limit?: number, skip?: number|string, fields?: string[]) => Promise<SearchResult<T>>, config?: SearchConfig|boolean, public dates?: string[], public numbers?: string[]) {
    this.search = this.search.bind(this);
    if (config) {
      if (typeof config === 'boolean') {
        this.csv = config;
      } else {
        this.config = initializeConfig(config);
        if (this.config) {
          this.csv = this.config.csv;
          this.fields = this.config.fields;
          this.excluding = this.config.excluding;
        }
      }
    }
    if (!this.fields || this.fields.length === 0) {
      this.fields = 'fields';
    }
  }
  search(req: Request, res: Response) {
    const s = fromRequest<S>(req, this.fields, this.excluding);
    const l = getParameters(s, this.config);
    const s2 = format(s, this.dates, this.numbers);
    this.find(s2, l.limit, l.skipOrRefId, l.fields)
      .then(result => jsonResult(res, result, this.csv, l.fields, this.config))
      .catch(err => handleError(err, res, this.log));
  }
}
