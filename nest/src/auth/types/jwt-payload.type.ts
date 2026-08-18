import { Role } from '../enums/role.enum';

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}