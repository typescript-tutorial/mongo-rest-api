import {Collection, Db} from 'mongodb';
import {valueOf} from './mongo';

export class FieldLoader {
  collection: Collection;
  constructor(db: Db, collectionName: string, public field: string) {
    this.collection = db.collection(collectionName);
    this.values = this.values.bind(this);
  }
  values(ids: string[]): Promise<string[]> {
    return valueOf<string>(this.collection, this.field, ids);
  }
}
