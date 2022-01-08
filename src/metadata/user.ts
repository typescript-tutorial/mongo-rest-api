export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
}
export interface UserService {
  all(): Promise<User[]>;
  load(id: string): Promise<User>;
  insert(user: User): Promise<number>;
  update(user: User): Promise<number>;
  patch(user: User): Promise<number>;
  delete(id: string): Promise<number>;
}
