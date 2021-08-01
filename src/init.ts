import { HealthController, resources } from 'express-ext';
import { Location } from 'models/Location';
import { Db } from 'mongodb';
import { createValidator } from 'validator-x';
import { ApplicationContext } from './context';
import { LocationController, LocationSM } from './controllers/LocationController';
import { UserController, UserSM } from './controllers/UserController';
import { User } from './models/User';
import { AuditLogWriter } from './services/mongo';
import { PointMapper } from './services/mongo/mongo';
import { MongoChecker } from './services/mongo/MongoChecker';
import { locationModel, MongoLocationService } from './services/mongo/MongoLocationService';
import { MongoUserService, userModel } from './services/mongo/MongoUserService';
import { buildQuery } from './services/mongo/query';
import { SearchBuilder } from './services/mongo/SearchBuilder';

export function log(msg: any): void {
  console.log(JSON.stringify(msg));
}
resources.createValidator = createValidator;
export function createContext(db: Db): ApplicationContext {
  const logWriter = new AuditLogWriter(db, 'auditLog');
  logWriter.write('duc', '11', 'login', 'test', true).then(r => console.log('ok'));
  const mapper = new PointMapper('location');
  const locationService = new MongoLocationService(db, 'location', mapper);
  const searchLocation = new SearchBuilder<Location, LocationSM>(db, 'location', buildQuery as any, locationModel.attributes, mapper.fromPoint, null, 'qu', 'ex2');
  const s = searchLocation.search;
  const locationController = new LocationController(null, s, locationService);
  // const queryUser: (s: UserSM, m?: Attributes) => FilterQuery<User> = buildQuery as any;
  const searchUser = new SearchBuilder<User, UserSM>(db, 'users', buildQuery as any, userModel.attributes);
  const userService = new MongoUserService(db, 'users');
  const userController = new UserController(log, searchUser.search, userService);
  const mongoChecker = new MongoChecker(db);
  const healthController = new HealthController([mongoChecker]);
  const ctx: ApplicationContext = { location: locationController, user: userController, health: healthController };
  return ctx;
}
