import {Request, Response} from 'express';
import {User} from '../models/User';
import {UserService} from '../services/UserService';
import {GenericController} from './GenericController';
import {GenericSearchController} from './GenericSearchController';
import {LoadController} from './LoadController';
import {Model} from './metadata';
import {SearchModel, SearchResult} from './search';

export interface UserSM extends SearchModel {
  id?: string;
  username?: string;
  email?: string;
  phone?: string;
}
export class UserController extends GenericSearchController<User, string, UserSM> {
  constructor(log: (msg: string, ctx?: any) => void, search: (s: UserSM, limit?: number, skip?: number, ctx?: any) => Promise<SearchResult<User>>, private userService: UserService) {
    super(log, search, userService);
    this.all = this.all.bind(this);
    /*
    this.load = this.load.bind(this);
    this.insert = this.insert.bind(this);
    this.update = this.update.bind(this);
    this.patch = this.patch.bind(this);
    this.delete = this.delete.bind(this);
    */
  }

  all(req: Request, res: Response) {
    this.userService.all()
      .then(users => res.status(200).json(users), err => res.status(500).end(err));
  }
  /*
  load(req: Request, res: Response) {
    const id = req.params['id'];
    if (!id || id.length === 0) {
      return res.status(400).end('Id cannot be empty');
    }
    this.userService.load(id)
      .then(user => {
        if (user) {
          res.status(200).json(user);
        } else {
          res.status(404).json(null);
        }
      }).catch(err => res.status(500).end(err));
  }
  insert(req: Request, res: Response) {
    const user = req.body;
    this.userService.insert(user)
      .then(result => {
        res.status(200).json(result);
      }).catch(err => res.status(500).end(err));
  }
  update(req: Request, res: Response) {
    const id = req.params['id'];
    if (!id || id.length === 0) {
      return res.status(400).end('Id cannot be empty');
    }
    const user = req.body;
    if (!user.id) {
      user.id = id;
    } else if (id !== user.id) {
      return res.status(400).end('Id not match');
    }
    this.userService.update(user)
      .then(result => res.status(200).json(result))
      .catch(err => res.status(500).end(err));
  }
  patch(req: Request, res: Response) {
    const id = req.params['id'];
    if (!id || id.length === 0) {
      return res.status(400).end('Id cannot be empty');
    }
    const user = req.body;
    if (!user.id) {
      user.id = id;
    } else if (id !== user.id) {
      return res.status(400).end('Id not match');
    }
    this.userService.patch(user)
      .then(result => res.status(200).json(result))
      .catch(err => res.status(500).end(err));
  }
  delete(req: Request, res: Response) {
    const id = req.params['id'];
    this.userService.delete(id)
      .then(result => res.status(200).json(result))
      .catch(err => res.status(500).end(err));
  }
  */
}
