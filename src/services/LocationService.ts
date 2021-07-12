import { Location } from '../models/Location';

export interface LocationService {
  all(): Promise<Location[]>;
  load(id: string): Promise<Location>;
  insert(user: Location): Promise<number>;
  update(user: Location): Promise<number>;
  patch?(user: Location): Promise<number>;
  delete(id: string): Promise<number>;
}
