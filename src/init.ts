import {Db} from 'mongodb';
import {ApplicationContext} from './context';
import {HealthController} from './controllers/HealthController';
import {UserController} from './controllers/UserController';
import {setValidator} from './controllers/validator';
import {MongoChecker} from './services/mongo/MongoChecker';
import {MongoUserService} from './services/mongo/MongoUserService';

export function log(msg: any): void {
  console.log(JSON.stringify(msg));
}
export function createContext(db: Db): ApplicationContext {
    const userService = new MongoUserService(db);
    const userController = new UserController(log, userService);
    setValidator(userController);
    const mongoChecker = new MongoChecker(db);
    const healthController = new HealthController([mongoChecker]);
    const ctx: ApplicationContext = {userController, healthController};
    return ctx;
}
