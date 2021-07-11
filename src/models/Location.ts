import { LocationInfo } from './LocationInfo';

export interface Location {
  id?: string;
  locationName?: string;
  description?: string;
  longitude?: number;
  latitude?: number;
  type?: string;
  thumbnail?: string;
  info?: LocationInfo;
  createdBy?: string;
  createdAt?: Date;
  updatedBy?: string;
  updatedAt?: Date;
  version?: number;
}
