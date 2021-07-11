import {Application} from 'express';
import {ApplicationContext} from './context';

export function route(app: Application, ctx: ApplicationContext): void {
  const user = ctx.user;
  app.get('/health', ctx.health.check);
  app.get('/locations', ctx.location.all);
  app.get('/locations/:id', ctx.location.load);
  app.post('/locations/search', ctx.location.search);

  app.get('/users', user.all);
  app.post('/users/search', user.search);
  app.get('/users/search', user.search);
  app.get('/users/:id', user.load);
  app.post('/users', user.insert);
  app.put('/users/:id', user.update);
  app.patch('/users/:id', user.patch);
  app.delete('/users/:id', user.delete);
}
