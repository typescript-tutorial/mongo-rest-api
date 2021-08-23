import {Gender} from './Gender';

export interface UserInfo {
  userId: string;
  username: string;
  email?: string;
  displayName: string;
  gender?: Gender;
  password?: string;
  disable?: boolean;
  deactivated?: boolean;
  suspended?: boolean;
  lockedUntilTime?: Date;
  successTime?: Date;
  failTime?: Date;
  failCount?: number;
  passwordModifiedTime?: Date;
  maxPasswordAge?: number;
  roles?: string[];

  userType?: string;
  privileges?: string[];
  accessDateFrom?: Date;
  accessDateTo?: Date;
  accessTimeFrom?: Date;
  accessTimeTo?: Date;

  language?: string;
  dateFormat?: string;
  imageUrl?: string;
}
