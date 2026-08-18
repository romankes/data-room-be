import { Injectable } from '@nestjs/common';

import {
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(nodeScrypt);
const PASSWORD_HASH_KEY_LENGTH = 64;
const PASSWORD_HASH_PREFIX = 'scrypt';

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derivedKey = (await scrypt(
      password,
      salt,
      PASSWORD_HASH_KEY_LENGTH,
    )) as Buffer;

    return [
      PASSWORD_HASH_PREFIX,
      salt.toString('hex'),
      derivedKey.toString('hex'),
    ].join(':');
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    const [prefix, saltHex, hashHex] = storedHash.split(':');

    if (prefix !== PASSWORD_HASH_PREFIX || !saltHex || !hashHex) {
      return false;
    }

    const storedKey = Buffer.from(hashHex, 'hex');

    if (storedKey.length !== PASSWORD_HASH_KEY_LENGTH) {
      return false;
    }

    const derivedKey = (await scrypt(
      password,
      Buffer.from(saltHex, 'hex'),
      PASSWORD_HASH_KEY_LENGTH,
    )) as Buffer;

    return timingSafeEqual(storedKey, derivedKey);
  }
}
