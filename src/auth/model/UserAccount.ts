import {Privilege} from './Privilege';

export interface UserAccount {
  userId?: string;
  username?: string;
  contact?: string;
  displayName?: string;
  passwordExpiredTime?: Date;
  token?: string;
  tokenExpiredTime?: Date;
  newUser?: boolean;
  userType?: string;
  roles?: string[];
  privileges?: Privilege[];
  language?: string;
  dateFormat?: string;
  timeFormat?: string;
  gender?: string;
  imageUrl?: string;
}
