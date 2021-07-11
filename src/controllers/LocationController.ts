import {Request, Response} from 'express';
import {fromRequest, GenericSearchController, getParameters, handleError, jsonResult, SearchController, SearchModel, SearchResult} from '../express-ext';
import {Location} from '../models/Location';
import {LocationService} from '../services/LocationService';

export interface LocationSM extends SearchModel {
  id?: string;
  type?: string;
}
export class LocationController {
  constructor(log: (msg: string, ctx?: any) => void, private find: (s: LocationSM, limit?: number, skip?: number, ctx?: any) => Promise<SearchResult<Location>>, private locationService: LocationService) {
    this.search = this.search.bind(this);
    this.all = this.all.bind(this);
    this.load = this.load.bind(this);
    /*
    this.insert = this.insert.bind(this);
    this.update = this.update.bind(this);
    this.patch = this.patch.bind(this);
    this.delete = this.delete.bind(this);
    */
  }
  search(req: Request, res: Response) {
    const s = fromRequest<LocationSM>(req);
    const l = getParameters(s);
    this.find(s, l.limit, l.skip, l.refId)
      .then(result => jsonResult(res, result, undefined, undefined, undefined))
      .catch(err => handleError(err, res, undefined));
  }
  all(req: Request, res: Response) {
    this.locationService.all()
      .then(locations => res.status(200).json(locations).end).catch(err => res.status(500).end(err));
  }
  load(req: Request, res: Response) {
    const id = req.params['id'];
    if (!id || id.length === 0) {
      return res.status(400).end('Id cannot be empty');
    }
    this.locationService.load(id)
      .then(location => {
        if (location) {
          res.status(200).json(location).end();
        } else {
          res.status(404).json(null).end();
        }
      }).catch(err => res.status(500).end(err));
  }
  /*
  insert(req: Request, res: Response) {
    const location = req.body;
    this.locationService.insert(location)
      .then(result => {
        res.status(200).json(result);
      }).catch(err => res.status(500).end(err));
  }
  update(req: Request, res: Response) {
    const id = req.params['id'];
    if (!id || id.length === 0) {
      return res.status(400).end('Id cannot be empty');
    }
    const location = req.body;
    if (!location.id) {
      location.id = id;
    } else if (id !== location.id) {
      return res.status(400).end('Id not match');
    }
    this.locationService.update(location)
      .then(result => res.status(200).json(result))
      .catch(err => res.status(500).end(err));
  }
  patch(req: Request, res: Response) {
    const id = req.params['id'];
    if (!id || id.length === 0) {
      return res.status(400).end('Id cannot be empty');
    }
    const location = req.body;
    if (!location.id) {
      location.id = id;
    } else if (id !== location.id) {
      return res.status(400).end('Id not match');
    }
    this.locationService.patch(location)
      .then(result => res.status(200).json(result))
      .catch(err => res.status(500).end(err));
  }
  delete(req: Request, res: Response) {
    const id = req.params['id'];
    this.locationService.delete(id)
      .then(result => res.status(200).json(result))
      .catch(err => res.status(500).end(err));
  }
  */
}
