import {UserInfo} from '../model/UserInfo';

export interface UserInfoService {
  getUserInfo(username: string): Promise<UserInfo>;
  passAuthentication(userId: string, deactivated?: boolean): Promise<boolean>;
  handleWrongPassword(userId: string, failCount?: number): Promise<boolean>;
}
