import type { AuthenticatedUser } from "../../domain/interfaces/authenticated-user.interface";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
