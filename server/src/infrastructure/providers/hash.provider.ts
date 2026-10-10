import bcrypt from "bcryptjs";
import type { IHashProvider } from "../../domain/interfaces/hash.provider.interface";

export class BcryptHashProvider implements IHashProvider {
  constructor(private readonly saltRounds: number) {}

  hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.saltRounds);
  }

  compare(plainText: string, hashedText: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashedText);
  }
}
