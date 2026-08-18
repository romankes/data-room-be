import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { EmailAuthDto } from '../dtos/email-auth.dto';
import { UserEntity } from '../entities/user.entity';
import { JwtService } from './jwt.service';
import { UsersService } from './users.service';

const scrypt = promisify(nodeScrypt);
const PASSWORD_HASH_KEY_LENGTH = 64;
const PASSWORD_HASH_PREFIX = 'scrypt';

export interface AuthResult {
  accessToken: string;
  user: UserEntity;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  createAccessToken(user: Pick<UserEntity, 'id'>): Promise<string> {
    return this.jwtService.createToken({ sub: user.id });
  }

  async register(dto: EmailAuthDto): Promise<AuthResult> {
    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.usersService.getCredentialsByEmail(email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await this.hashPassword(dto.password);

    try {
      const user = await this.usersService.createWithPassword(
        email,
        passwordHash,
      );

      return {
        user,
        accessToken: await this.createAccessToken(user),
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('User with this email already exists');
      }

      throw error;
    }
  }

  async login(dto: EmailAuthDto): Promise<AuthResult> {
    const user = await this.usersService.getCredentialsByEmail(
      this.normalizeEmail(dto.email),
    );

    if (
      !user?.passwordHash ||
      !(await this.verifyPassword(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const publicUser: UserEntity = {
      id: user.id,
      email: user.email,
    };

    return {
      user: publicUser,
      accessToken: await this.createAccessToken(publicUser),
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async hashPassword(password: string): Promise<string> {
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

  private async verifyPassword(
    password: string,
    storedHash: string,
  ): Promise<boolean> {
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

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
