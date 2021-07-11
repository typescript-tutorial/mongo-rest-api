import {Response} from 'express';

export function handleError(err: any, res: Response, log?: (msg: string, ctx?: any) => void) {
  if (log) {
    log(err as any);
    res.status(500).send('Internal Server Error');
  } else {
    res.status(500).send(err);
  }
}
