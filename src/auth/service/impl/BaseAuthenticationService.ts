import {generateToken} from 'jsonwebtoken-plus';
import {AuthInfo} from '../../model/AuthInfo';
import {AuthResult} from '../../model/AuthResult';
import {AuthStatus} from '../../model/AuthStatus';
import {Privilege} from '../../model/Privilege';
import {UserAccount} from '../../model/UserAccount';
import {UserInfo} from '../../model/UserInfo';
import {UserInfoService} from '../../service/UserInfoService';
import {DateUtil} from '../../util/DateUtil';
import {AuthenticationService} from '../AuthenticationService';
import {PrivilegeService} from '../PrivilegeService';

export abstract class BaseAuthenticationService implements AuthenticationService {
  readonly MILLISECONDS_IN_ONE_DAY = 86400000;
  readonly SECONDS_IN_ONE_DAY = 86400;

  protected constructor(protected userInfoService: UserInfoService, protected tokenSecret: string, protected tokenExpires: number, protected privilegeService?: PrivilegeService) {
  }

  public abstract authenticate(signinInfo: AuthInfo): Promise<AuthResult>;

  protected async processUserInfo(result: AuthResult, user: UserInfo): Promise<AuthResult> {
    if (user.suspended) {
      result.status = AuthStatus.Suspended;
      return result;
    }
    const locked = (!!user.lockedUntilTime && (DateUtil.compareDateTime(DateUtil.now(), user.lockedUntilTime) < 0));
    if (locked) {
      result.status = AuthStatus.Locked;
      return result;
    }

    let passwordExpiredTime = null;
    if (!!user.passwordModifiedTime && !!user.maxPasswordAge) {
      passwordExpiredTime = DateUtil.addDays(user.passwordModifiedTime, user.maxPasswordAge);
    }
    if (passwordExpiredTime !== null && DateUtil.compareDateTime(DateUtil.now(), passwordExpiredTime) > 0) {
      result.status = AuthStatus.PasswordExpired;
      return result;
    }

    const arrSecondsLeft = [Math.floor(this.tokenExpires / 1000)];
    const secondsLeftFromAccessDate = this.getSecondsLeftFromAccessDate(user.accessDateFrom, user.accessDateTo);
    if (secondsLeftFromAccessDate != null) {
      if (secondsLeftFromAccessDate <= 0) {
        result.status = AuthStatus.Disabled;
        return result;
      } else if (secondsLeftFromAccessDate > 0) {
        arrSecondsLeft.push(secondsLeftFromAccessDate);
      }
    }

    const secondsLeftFromAccessTime = this.getSecondsLeftFromAccessTime(null, null);
    if (secondsLeftFromAccessTime != null) {
      if (secondsLeftFromAccessTime <= 0) {
        result.status = AuthStatus.AccessTimeLocked;
        return result;
      } else if (secondsLeftFromAccessTime > 0) {
        arrSecondsLeft.push(secondsLeftFromAccessTime);
      }
    }
    const minSecondsLeft = Math.min(...arrSecondsLeft);

    const storedUser = {
      userId: user.userId,
      username: user.username,
      email: user.email,
      userType: user.userType
    };
    const token = await generateToken(storedUser, this.tokenSecret, minSecondsLeft);
    result.status = (user.deactivated === true ? AuthStatus.SuccessAndReactivated : AuthStatus.Success);
    const account = this.mapUserInfoToUserAccount(user);
    account.passwordExpiredTime = passwordExpiredTime;
    account.token = token;
    account.tokenExpiredTime = DateUtil.addSeconds(new Date(), minSecondsLeft);
    account.newUser = false;
    if (this.privilegeService != null) {
        const menu = await this.privilegeService.getPrivileges(user.username);
        const menus: Privilege[] = [];
        if (menu) {
            for (const item of menu) {
                if (item.children.length > 0) {
                    menus.push(item);
                }
            }
            account.privileges = menus;
        }
    }
    result.user = account;
    console.log(user);
    const isUpdateStatus = this.userInfoService.passAuthentication(user);
    result.status = AuthStatus.Success;
    console.log('result', result);
    return result;
  }

  private getSecondsLeftFromAccessDate(accessDateFrom: Date, accessDateTo: Date): number {
    const now = new Date();
    if (accessDateFrom && typeof accessDateFrom === 'string') {
      accessDateFrom = new Date(accessDateFrom + 'GMT+0700');
    }
    if (accessDateFrom && DateUtil.compareDateTime(now, accessDateFrom) < 0) {
      return -1;
    }
    if (accessDateTo) {
      if (typeof accessDateTo === 'string') {
        accessDateTo = new Date(accessDateTo + 'GMT+0700');
      }
      const endOfDayAccessDateTo = accessDateTo.getTime() + this.MILLISECONDS_IN_ONE_DAY;
      return Math.round((endOfDayAccessDateTo - now.getTime()) / 1000);
    }
    return null;
  }

  private getSecondsLeftFromAccessTime(accessTimeFrom: Date, accessTimeTo: Date): number {
    const today = new Date();
    const currentSeconds = Math.round(today.getTime() / 1000) % this.SECONDS_IN_ONE_DAY;
    if (accessTimeFrom && DateUtil.compareDateTime(today, accessTimeFrom) < 0) {
      return -1;
    }
    if (accessTimeTo) {
      let toSeconds = Math.round(accessTimeTo.getTime() / 1000) % this.SECONDS_IN_ONE_DAY;
      if (toSeconds === 0) {
        if (toSeconds === null || toSeconds === 0) {
          return null;
        }
        toSeconds = this.SECONDS_IN_ONE_DAY;
      }
      return toSeconds - currentSeconds;
    }
  }

  private mapUserInfoToUserAccount(user: UserInfo): UserAccount {
    const account: UserAccount = {
      userId: user.userId,
      username: user.username,
      contact: user.email,
      displayName: user.displayName,
      userType: user.userType
    };
    return account;
  }
}
