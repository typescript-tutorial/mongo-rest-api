export enum AuthStatus {
  Success = 0,
  SuccessAndReactivated = 1,
  TwoFactorRequired,
  Fail = 3,
  WrongPassword = 4,
  PasswordExpired = 5,
  AccessTimeLocked = 6,
  Locked = 7,
  Suspended = 8,
  Disabled = 9,
  SystemError = 10,
}
