import {Request, Response} from 'express';
import {ResultInfo, StatusConfig} from './edit';
import {GenericController, GenericService} from './GenericController';
import {ErrorMessage} from './metadata';
import {handleError} from './response';
import {format, fromRequest, getParameters, initializeConfig, jsonResult, SearchConfig, SearchModel, SearchResult} from './search';
import {getMetadataFunc} from './search_func';

export interface Config extends StatusConfig, SearchConfig {
}
export class GenericSearchController<T, ID, S extends SearchModel> extends GenericController<T, ID> {
  config?: SearchConfig;
  csv?: boolean;
  dates?: string[];
  numbers?: string[];
  constructor(log: (msg: string, ctx?: any) => void, public find: (s: S, limit?: number, skip?: number|string, fields?: string[]) => Promise<SearchResult<T>>, service: GenericService<T, ID, number|ResultInfo<T>>, config?: Config, validate?: (obj: T, patch?: boolean) => Promise<ErrorMessage[]>, dates?: string[], numbers?: string[]) {
    super(log, service, config, validate);
    this.search = this.search.bind(this);
    this.config = initializeConfig(config);
    if (this.config) {
      this.csv = this.config.csv;
    }
    const m = getMetadataFunc(service, dates, numbers);
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
