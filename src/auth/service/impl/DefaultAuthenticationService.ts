
import {AuthInfo} from '../../model/AuthInfo';
import {AuthResult} from '../../model/AuthResult';
import {AuthStatus} from '../../model/AuthStatus';
import {Privilege} from '../../model/Privilege';
import {StoredUser} from '../../model/StoredUser';
import {TokenConf} from '../../model/TokenConf';
import {UserAccount} from '../../model/UserAccount';
import {UserInfo} from '../../model/UserInfo';
import {DateUtil} from '../../util/DateUtil';
import {AuthenticationService} from '../AuthenticationService';
import {UserInfoService} from '../UserInfoService';

export class DefaultAuthenticationService implements AuthenticationService {

  constructor(
    public compare: (v1: string, v2: string) => Promise<boolean>,
    public getPrivileges: (username: string) => Promise<Privilege[]>,
    public generateToken: (payload: any, secret: string, expiresIn: number) => Promise<string>,
    public userInfoService: UserInfoService,
    public tokenConfig: TokenConf,
    public check?: (signinInfo: AuthInfo) => Promise<AuthResult>,
  ) {

  }

  async authenticate(info: AuthInfo): Promise<AuthResult> {
    let result: AuthResult = {
      status: AuthStatus.Fail
    };
    const username = info.username;
    const password = info.password;

    if (!username || username === '' || !password || password === '') {
      return result;
    }

    if (this.check) {
      result = await this.check(info);
      if (result == null || result.status !== AuthStatus.Success && result.status !== AuthStatus.SuccessAndReactivated) {
        return result;
      }
      if (this.userInfoService !== null) {
        const tokenExpiredTime0 = DateUtil.addSeconds(new Date(), this.tokenConfig.expires);
        let payload0: StoredUser = {};
        if (result.user === null) {
          payload0 = {userId: info.username, username: info.username};
        } else {
          const u = result.user;
          payload0 = {userId: u.userId, username: u.username, contact: u.contact, userType: u.userType, roles: u.roles};
        }
        const token0 = await this.generateToken(payload0, this.tokenConfig.secret, this.tokenConfig.expires);
        const account0: UserAccount = {};
        account0.token = token0;
        account0.tokenExpiredTime = tokenExpiredTime0;
        result.status = AuthStatus.Success;
        result.user = account0;
        return result;
      }
    }


    const user = await this.userInfoService.getUserInfo(info.username);
    if (!user) {
      result.status = AuthStatus.Fail;
      result.message = 'UserNotExisted';
      return result;
    }
    if (!user.password) {
      user.password = '';
    }

    if (!this.check) {
      const valid = await this.compare(password, user.password);
      if (!valid) {
        result.status = AuthStatus.WrongPassword;
        const isUpdateStatus = await this.userInfoService.handleWrongPassword(user.userId, user.failCount);
        if (!isUpdateStatus) {
          result.status = AuthStatus.Fail;
          return result;
        }
        return result;
      }
      const account1: UserAccount = {};
      result.user = account1;
    }

    if (user.disable) {
      result.status = AuthStatus.Disabled;
      return result;
    }

    if (user.suspended) {
      result.status = AuthStatus.Suspended;
      return result;
    }

    const locked = (user.lockedUntilTime !== null && (DateUtil.compareDateTime(DateUtil.now(), user.lockedUntilTime) < 0));
    if (locked) {
      result.status = AuthStatus.Locked;
      return result;
    }

    let passwordExpiredTime = null;
    if (user.passwordModifiedTime !== null && user.maxPasswordAge !== 0) {
      passwordExpiredTime = DateUtil.addDays(user.passwordModifiedTime, user.maxPasswordAge);
    }
    if (passwordExpiredTime !== null && DateUtil.compareDateTime(DateUtil.now(), passwordExpiredTime) > 0) {
      result.status = AuthStatus.PasswordExpired;
      return result;
    }

    if (isAccessDateValid(user.accessDateFrom, user.accessDateTo) === false) {
      result.status = AuthStatus.Disabled;
      return result;
    }

    if (isAccessTimeValid(user.accessTimeFrom, user.accessTimeTo) === false) {
      result.status = AuthStatus.AccessTimeLocked;
      return result;
    }

    const {tokenExpiredTime, jwtTokenExpires} = setTokenExpiredTime(user);
    const payload: StoredUser = {userId: user.userId, username: user.username, contact: user.email, userType: user.userType, roles: user.roles, privileges: user.privileges};
    const token = await this.generateToken(payload, this.tokenConfig.secret, jwtTokenExpires);
    if (user.deactivated) {
      result.status = AuthStatus.SuccessAndReactivated;
    } else {
      result.status = AuthStatus.Success;
    }

    const account = mapUserInfoToUserAccount(user, result.user);
    account.token = token;
    account.tokenExpiredTime = tokenExpiredTime;

    if (this.getPrivileges) {
      const privileges = await this.getPrivileges(user.username);
      account.privileges = privileges;
    }
    result.user = account;
    const isStatus = await this.userInfoService.passAuthentication(user.userId, user.deactivated);
    if (isStatus === false) {
      result.status = AuthStatus.Fail;
      return result;
    }
    return result;
  }
}

export interface CustomJwtToken {
  tokenExpiredTime: Date;
  jwtTokenExpires: number;
}

export function mapUserInfoToUserAccount(user: UserInfo, account: UserAccount): UserAccount {
  account.userId = user.userId;
  account.username = user.username;
  account.userType = user.userType;
  account.roles = user.roles;
  if (user.userId.length > 0) {
    account.userId = user.userId;
  }
  if (user.displayName && user.displayName.length > 0) {
    account.displayName = user.displayName;
  }
  if (user.email && user.email.length > 0) {
    account.contact = user.email;
  }
  return account;
}
export function setTokenExpiredTime(user: UserInfo): CustomJwtToken {
  if (user.accessTimeTo == null || user.accessTimeFrom == null || user.accessDateFrom == null || user.accessDateTo == null) {
    const x = DateUtil.addSeconds(DateUtil.now(), this.tokenConfig.expires / 1000);
    return {tokenExpiredTime: x, jwtTokenExpires: this.tokenConfig.expires};
  }

  if (DateUtil.before(user.accessTimeTo, user.accessTimeFrom) || DateUtil.equal(user.accessTimeTo, user.accessDateFrom)) {
    const tmp = DateUtil.addHours(user.accessTimeTo, 24);
    user.accessDateTo = tmp;
  }

  let tokenExpiredTime: Date = new Date();
  let jwtExpiredTime = 0;

  if (this.tokenConfig.expires > DateUtil.sub(user.accessTimeTo, DateUtil.now())) {
    tokenExpiredTime = DateUtil.addSeconds(DateUtil.now(), DateUtil.sub(user.accessTimeTo, DateUtil.now()));
    jwtExpiredTime = DateUtil.sub(user.accessTimeTo, DateUtil.now()) / 1000;
  } else {
    tokenExpiredTime = DateUtil.addSeconds(DateUtil.now(), this.tokenConfig.expires / 1000) ;
    jwtExpiredTime = this.tokenConfig.expires;
  }
  return {tokenExpiredTime, jwtTokenExpires: jwtExpiredTime};
}

export function isAccessDateValid(fromDate: Date, toDate: Date): boolean {
  const today = DateUtil.now();
  if (fromDate == null && toDate == null) {
    return true;
  } else if (fromDate == null) {
    const toDateNew = DateUtil.addHours(toDate, 24);
    if (DateUtil.after(toDateNew, today) === true) {
      return true;
    }
  } else if (toDate == null) {
    if (DateUtil.before(fromDate, today) === true || DateUtil.equal(fromDate, today) === true) {
      return true;
    }
  } else {
    const toDateNew = DateUtil.addHours(toDate, 24);
    if (DateUtil.before(fromDate, today) === true || DateUtil.equal(fromDate, today) === true && DateUtil.after(toDateNew, toDate) === true) {
      return true;
    }
  }
  return false;
}

export function isAccessTimeValid(fromTime: Date, toTime: Date): boolean {
  const today = DateUtil.now();
  if (fromTime == null && toTime == null) {
    return true;
  } else if (fromTime == null) {
    if (DateUtil.after(toTime, today) === true || DateUtil.equal(toTime, today) === true) {
      return true;
    }
    return false;
  } else if (toTime == null) {
    if (DateUtil.before(fromTime, today) === true || DateUtil.equal(fromTime, today) === true) {
      return true;
    }
    return false;
  }

  if (DateUtil.before(toTime, fromTime) === true || DateUtil.equal(toTime, fromTime) === true) {
    toTime = DateUtil.addHours(toTime, 24);
  }
  if (DateUtil.before(fromTime, today) === true || DateUtil.equal(fromTime, today) === true && DateUtil.after(toTime, today) === true || DateUtil.equal(toTime, today) === true) {
    return true;
  }
  return false;
}
