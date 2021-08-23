import {AuthStatus} from './AuthStatus';
import {UserAccount} from './UserAccount';

export interface AuthResult {
  status: AuthStatus;
  user?: UserAccount;
  message?: string;
}
