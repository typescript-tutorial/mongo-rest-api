import dotenv from 'dotenv';
import express, { json } from 'express';
import http from 'http';
import { createContext } from './context';
import { connectToDb } from './mongo';
import { route } from './route';

dotenv.config();

const app = express();

const port = process.env.PORT;
const mongoURI = process.env.MONGO_URI;
const mongoDB = process.env.MONGO_DB;

app.use(json());

connectToDb(`${mongoURI}`, `${mongoDB}`).then(db => {
  const ctx = createContext(db);
  route(app, ctx);
  http.createServer(app).listen(port, () => {
    console.log('Start server at port ' + port);
  });
});
