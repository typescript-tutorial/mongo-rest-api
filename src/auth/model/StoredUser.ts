import {Privilege} from './Privilege';

export interface StoredUser {
  userId?: string;
  username?: string;
  contact?: string;
  // displayName: string;
  // gender?: Gender;
  // passwordExpiredTime?: Date;
  // token?: string;
  // tokenExpiredDate?: Date;
  // newUser?: boolean;
  userType?: string;
  roles?: string[];
  privileges?: string[];
  tokens?: any;
  // privileges?: Privilege[];
}
