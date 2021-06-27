import {Request, Response} from 'express';
import {ResultInfo, StatusConfig} from './edit';
import {GenericController, GenericService} from './GenericController';
import {ErrorMessage} from './metadata';
import {handleError} from './response';
import {fromRequest, getLimit, initializeConfig, jsonResult, SearchConfig, SearchModel, SearchResult} from './search';

export interface Config extends StatusConfig, SearchConfig {
}
export class GenericSearchController<T, ID, S extends SearchModel> extends GenericController<T, ID> {
  config?: SearchConfig;
  quick?: boolean;
  constructor(log: (msg: string, ctx?: any) => void, public find: (s: S, limit?: number, skip?: number, ctx?: any) => Promise<SearchResult<T>>, service: GenericService<T, ID, number|ResultInfo<T>>, config?: Config, validate?: (obj: T, patch?: boolean) => Promise<ErrorMessage[]>, public format?: (s: S) => S) {
    super(log, service, config, validate);
    this.config = initializeConfig(config);
    this.quick = config.quick;
  }
  search(req: Request, res: Response) {
    const s = fromRequest<S>(req, this.format);
    const l = getLimit(s);
    this.find(s, l.limit, l.skip)
      .then(result => jsonResult(res, result, this.quick, s.fields, this.config))
      .catch(err => handleError(err, res, this.log));
  }
}
