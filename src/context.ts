import { LocationController } from 'controllers/LocationController';
import { HealthController } from 'express-ext';
import { UserController } from './controllers/UserController';

export interface ApplicationContext {
  user: UserController;
  location: LocationController;
  health: HealthController;
}
