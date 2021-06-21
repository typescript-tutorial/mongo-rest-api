import {Db} from 'mongodb';
import {ApplicationContext} from './context';
import {HealthController} from './controllers/HealthController';
import {UserController} from './controllers/UserController';
import {MongoChecker} from './services/mongo/MongoChecker';
import {MongoUserService} from './services/mongo/MongoUserService';

export function createContext(db: Db): ApplicationContext {
    const userService = new MongoUserService(db);
    const userController = new UserController(userService);
    const mongoChecker = new MongoChecker(db);
    const healthController = new HealthController([mongoChecker]);
    const ctx: ApplicationContext = {userController, healthController};
    return ctx;
}
