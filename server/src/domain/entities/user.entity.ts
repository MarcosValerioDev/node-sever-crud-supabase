export const USER_ROLES = ["USER", "ADMIN"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface UserProps {
  id: string;
  email: string;
  name: string | null;
  password: string;
  role: UserRole;
  isActive: boolean;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserEntity {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly password: string;
  readonly role: UserRole;
  readonly isActive: boolean;
  readonly isBlocked: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.name = props.name;
    this.password = props.password;
    this.role = props.role;
    this.isActive = props.isActive;
    this.isBlocked = props.isBlocked;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isAdmin(): boolean {
    return this.role === "ADMIN";
  }

  canAuthenticate(): boolean {
    return this.isActive && !this.isBlocked;
  }
}
