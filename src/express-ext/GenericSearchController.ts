import {Request, Response} from 'express';
import {ResultInfo, StatusConfig} from './edit';
import {GenericController, GenericService} from './GenericController';
import {handleError} from './http';
import {ErrorMessage} from './metadata';
import {format, fromRequest, getParameters, initializeConfig, jsonResult, SearchConfig, SearchModel, SearchResult} from './search';
import {getMetadataFunc} from './search_func';

export interface Config extends StatusConfig, SearchConfig {
}
export class GenericSearchController<T, ID, S extends SearchModel> extends GenericController<T, ID> {
  config?: SearchConfig;
  csv?: boolean;
  dates?: string[];
  numbers?: string[];
  fields?: string;
  excluding?: string;
  constructor(log: (msg: string, ctx?: any) => void, public find: (s: S, limit?: number, skip?: number|string, fields?: string[]) => Promise<SearchResult<T>>, service: GenericService<T, ID, number|ResultInfo<T>>, config?: Config, validate?: (obj: T, patch?: boolean) => Promise<ErrorMessage[]>, dates?: string[], numbers?: string[]) {
    super(log, service, config, validate);
    this.search = this.search.bind(this);
    this.config = initializeConfig(config);
    if (this.config) {
      this.csv = this.config.csv;
      this.fields = this.config.fields;
      this.excluding = this.config.excluding;
    }
    if (!this.fields || this.fields.length === 0) {
      this.fields = 'fields';
    }
    const m = getMetadataFunc(service, dates, numbers);
    this.dates = m.dates;
    this.numbers = m.numbers;
  }
  search(req: Request, res: Response) {
    const s = fromRequest<S>(req, this.fields, this.excluding);
    const l = getParameters(s, this.fields);
    const s2 = format(s, this.dates, this.numbers);
    this.find(s2, l.limit, l.skipOrRefId, l.fields)
      .then(result => jsonResult(res, result, this.csv, l.fields, this.config))
      .catch(err => handleError(err, res, this.log));
  }
}
