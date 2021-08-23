import {AuthInfo} from '../model/AuthInfo';
import {AuthResult} from '../model/AuthResult';

export interface AuthenticationService {
  authenticate(signinInfo: AuthInfo): Promise<AuthResult>;
}
