import { Role } from '../enums/role.enum';

export interface AuthUser {
  userId: number;
  email: string;
  role: Role;
}