import { Db } from 'mongodb';
import { UserController } from './controller/user-controller';
import { MongoUserService } from './service/mongo-user-service';

export interface ApplicationContext {
  userController: UserController;
}
export function createContext(db: Db): ApplicationContext {
  const userService = new MongoUserService(db);
  const userController = new UserController(userService);
  const ctx: ApplicationContext = { userController };
  return ctx;
}
