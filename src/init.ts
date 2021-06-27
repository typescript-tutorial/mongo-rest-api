import {Db, FilterQuery} from 'mongodb';
import {ApplicationContext} from './context';
import {HealthController} from './controllers/HealthController';
import {Attributes} from './controllers/metadata';
import {UserController, UserSM} from './controllers/UserController';
import {User} from './models/User';
import {MongoChecker} from './services/mongo/MongoChecker';
import {MongoUserService, userModel} from './services/mongo/MongoUserService';
import {buildQuery} from './services/mongo/query';
import {SearchBuilder} from './services/mongo/SearchBuilder';

export function log(msg: any): void {
  console.log(JSON.stringify(msg));
}
export function createContext(db: Db): ApplicationContext {
  const buildQuery2: (s: UserSM, m?: Attributes) => FilterQuery<User> = buildQuery as any;
  const searchBuilder = new SearchBuilder(db.collection('users'), buildQuery2, userModel.attributes);
  const userService = new MongoUserService(db);
  const userController = new UserController(log, searchBuilder.search, userService);
  const mongoChecker = new MongoChecker(db);
  const healthController = new HealthController([mongoChecker]);
  const ctx: ApplicationContext = {userController, healthController};
  return ctx;
}
