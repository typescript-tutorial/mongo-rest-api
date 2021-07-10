import {HealthController, resources} from 'express-ext';
import {Db, FilterQuery} from 'mongodb';
import {createValidator} from 'validator-x';
import {ApplicationContext} from './context';
import { LocationController } from './controllers/LocationController';
import {UserController, UserSM} from './controllers/UserController';
import {User} from './models/User';
import {Attributes} from './services/mongo/metadata';
import {MongoChecker} from './services/mongo/MongoChecker';
import { MongoLocationService } from './services/mongo/MongoLocationService';
import {MongoUserService, userModel} from './services/mongo/MongoUserService';
import {buildQuery} from './services/mongo/query';
import {SearchBuilder} from './services/mongo/SearchBuilder';

export function log(msg: any): void {
  console.log(JSON.stringify(msg));
}
resources.createValidator = createValidator;
export function createContext(db: Db): ApplicationContext {
  const locationService = new MongoLocationService(db);
  const locationController = new LocationController(null, locationService);
  const buildQuery2: (s: UserSM, m?: Attributes) => FilterQuery<User> = buildQuery as any;
  const searchBuilder = new SearchBuilder(db.collection('users'), buildQuery2, userModel.attributes);
  const userService = new MongoUserService(db);
  const userController = new UserController(log, searchBuilder.search, userService);
  const mongoChecker = new MongoChecker(db);
  const healthController = new HealthController([mongoChecker]);
  const ctx: ApplicationContext = {location: locationController, user: userController, health: healthController};
  return ctx;
}
