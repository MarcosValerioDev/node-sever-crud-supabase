import type { IHashProvider } from "../../domain/interfaces/hash.provider.interface";

const HASH_PREFIX = "hashed:";

export class FakeHashProvider implements IHashProvider {
  async hash(plainText: string): Promise<string> {
    return `${HASH_PREFIX}${plainText}`;
  }

  async compare(plainText: string, hashedText: string): Promise<boolean> {
    return hashedText === `${HASH_PREFIX}${plainText}`;
  }
}
