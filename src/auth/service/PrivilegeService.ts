import {Privilege} from '../model/Privilege';

export interface PrivilegeService {
  getPrivileges(username: string): Promise<Privilege[]>;
}
