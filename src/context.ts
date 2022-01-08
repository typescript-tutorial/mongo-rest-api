import {UserController} from './controllers/UserController';

export interface ApplicationContext {
  userController: UserController;
}
export function createContext(db: Db): ApplicationContext {
  const userService = new MongoUserService(db);
  const userController = new UserController(userService);
  const ctx: ApplicationContext = { userController };
  return ctx;
}
