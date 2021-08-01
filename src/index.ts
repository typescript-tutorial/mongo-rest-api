import {json} from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import {createContext} from './init';
import {route} from './route';
import {connectToDb} from './services/mongo/mongo';

dotenv.config();

const app = express();

const port = process.env.PORT;
const mongoURI = process.env.MONGO_URI;
const mongoDB = process.env.MONGO_DB;

app.use(json());

connectToDb(`${mongoURI}`, `${mongoDB}`).then(db => {
  /*
  console.log(isValidScale(20.0120, 2));
  console.log(isValidScale(20.020, 2));
  console.log(isValidScale(20.20, 2));
  */
  console.log(isValidPrecision(20.0120, 5, 3));
  console.log(isValidPrecision(320.0120, 5, 2));
  console.log(isValidPrecision(4320.0120, 5, 2));
  console.log(isValidPrecision(20.020, 4, 2));
  console.log(isValidPrecision(20.20, 4, 2));
  const ctx = createContext(db);
  route(app, ctx);
  http.createServer(app).listen(port, () => {
    console.log('Start server at port ' + port);
  });
});

export function isValidScale(n: number, scale: number): boolean {
  if (isNaN(n) || n === undefined || n == null) {
    return true;
  }
  if (scale === undefined || scale == null || scale < 0) {
    return true;
  }
  const s1 = n.toPrecision();
  console.log('s ' + s1);
  const s = n.toString();
  const i = s.indexOf('.');
  if (i < 0) {
    return true;
  }
  const s2 = s.substr(i + 1);
  console.log('s2 ' + s2);
  return (s2.length <= scale);
}
export function isValidPrecision(n: number, precision: number, scale?: number): boolean {
  if (isNaN(n) || n === undefined || n == null) {
    return true;
  }
  if (precision === undefined || precision == null || precision < 0) {
    return isValidScale(n, scale);
  }
  if (scale === undefined || scale == null || scale < 0) {
    scale = 0;
  }
  const s = n.toString();
  const i = s.indexOf('.');
  if (i < 0) {
    return (s.length <= (precision - scale));
  }
  const s2 = s.substr(i + 1);
  if (s2.length > scale) {
    return false;
  }
  const s3 = s.substr(0, i);
  console.log('s3 ' + s3);
  return (s3.length <= (precision - scale));
}
