import {Request, Response} from 'express';
import {User} from '../models/User';
import {UserService} from '../services/UserService';
import {LoadController} from './LoadController';
import {Model} from './metadata';

export const userModel: Model = {
  name: 'user',
  attributes: {
    userId: {
      type: 'string',
      key: true
    },
    username: {
      type: 'string'
    },
  }
};
export function log(msg: string): void {
  console.log(msg);
}
export class UserController extends LoadController<User, string> {
  constructor(private userService: UserService) {
    super(log, userService.load, userModel.attributes);
    this.all = this.all.bind(this);
    // this.load = this.load.bind(this);
    this.insert = this.insert.bind(this);
    this.update = this.update.bind(this);
    this.patch = this.patch.bind(this);
    this.delete = this.delete.bind(this);
  }

  all(req: Request, res: Response) {
    this.userService.all()
      .then(users => res.status(200).json(users), err => res.status(500).send(err));
  }
  /*
  load(req: Request, res: Response) {
    const id = req.params['id'];
    if (!id || id.length === 0) {
      return res.status(400).send('Id cannot be empty');
    }
    this.userService.load(id)
      .then(user => {
        if (user) {
          res.status(200).json(user);
        } else {
          res.status(404).json(null);
        }
      }).catch(err => res.status(500).send(err));
  }
  */
  insert(req: Request, res: Response) {
    const user = req.body;
    this.userService.insert(user)
      .then(result => {
        res.status(200).json(result);
      }).catch(err => res.status(500).send(err));
  }
  update(req: Request, res: Response) {
    const id = req.params['id'];
    if (!id || id.length === 0) {
      return res.status(400).send('Id cannot be empty');
    }
    const user = req.body;
    if (!user.id) {
      user.id = id;
    } else if (id !== user.id) {
      return res.status(400).send('Id not match');
    }
    this.userService.update(user)
      .then(result => res.status(200).json(result))
      .catch(err => res.status(500).send(err));
  }
  patch(req: Request, res: Response) {
    const id = req.params['id'];
    if (!id || id.length === 0) {
      return res.status(400).send('Id cannot be empty');
    }
    const user = req.body;
    if (!user.id) {
      user.id = id;
    } else if (id !== user.id) {
      return res.status(400).send('Id not match');
    }
    this.userService.patch(user)
      .then(result => res.status(200).json(result))
      .catch(err => res.status(500).send(err));
  }
  delete(req: Request, res: Response) {
    const id = req.params['id'];
    this.userService.delete(id)
      .then(result => res.status(200).json(result))
      .catch(err => res.status(500).send(err));
  }
}
