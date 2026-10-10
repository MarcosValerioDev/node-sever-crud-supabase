import type { UserRole } from "../entities/user.entity";

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}
