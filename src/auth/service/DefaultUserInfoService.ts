
import {User, UserStatus} from '../../../shared/user-model';
import {AuthenticationRepository, UserRepository} from '../../../shared/user-repository';
import { AuthInfo } from '../../auth/model/AuthInfo';
import { UserInfo } from '../../auth/model/UserInfo';
import { UserInfoService } from './UserInfoService';

export class UserInfoServiceImpl implements UserInfoService {
  constructor(
    private userRepository: UserRepository,
    private authenticationRepository: AuthenticationRepository,
    private maxPasswordFailed: number,
    private lockedMinutes: number
  ) {

  }

  async getUserInfo(username: string): Promise<UserInfo> {
    const user: User = await this.userRepository.findByUserName(info.username);
    if (!user) {
      return null;
    }
    const auth: any = await this.authenticationRepository.load(user.userId);
    const userInfo: UserInfo = {
      userId: user.userId,
      username: user.username,
      email: user.email,
      disable: user.disable,
      maxPasswordAge: user.maxPasswordAge,
      displayName: user.displayName,
      suspended: (user.status === UserStatus.Suspended),
      deactivated: (user.status === UserStatus.Deactivated)
    };
    if (!!auth) {
      userInfo.password = auth.password;
      userInfo.lockedUntilTime = auth.lockedUntilTime;
      userInfo.successTime = auth.successTime;
      userInfo.failTime = auth.failTime;
      userInfo.failCount = auth.failCount;
      userInfo.passwordModifiedTime = auth.passwordModifiedTime;
    }
    return userInfo;
  }

  async passAuthentication(user0: UserInfo): Promise<boolean> {
    const result = await this.authenticationRepository.passAuthentication(user0.userId);
    if (user0.deactivated === true) {
      const user: User = {};
      user.userId = user0.userId;
      user.status = UserStatus.Activated;
      const result1 = await this.userRepository.patch(user);
      if (result1 > 0) {
        return true;
      }
      return false;
    }
    return true;
  }

  async handleWrongPassword(user: UserInfo): Promise<boolean> {
    if (this.maxPasswordFailed > 0 && user.failCount >= this.maxPasswordFailed) {
      const lockedUntilTime = addSeconds(new Date(), this.lockedMinutes * 60);
      return this.authenticationRepository.wrongPassword(user.userId, 0, lockedUntilTime);
    }
    const count = user.failCount + 1;
    return this.authenticationRepository.wrongPassword(user.userId, count, null);
  }
}

export function addSeconds(date: Date, number: number) {
  // return moment(date).add(number, 'seconds').toDate();
  const newDate = new Date(date);
  newDate.setSeconds(newDate.getSeconds() + number);
  return newDate;
}
