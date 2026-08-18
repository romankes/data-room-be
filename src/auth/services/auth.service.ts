import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { EmailAuthDto } from '../dtos/email-auth.dto';
import { UserEntity } from '../entities/user.entity';
import { mapUser } from '../../mappers/user.mapper';
import { JwtService } from './jwt.service';
import { UsersService } from './users.service';
import { PasswordService } from './password.service';

export interface AuthResult {
  accessToken: string;
  user: UserEntity;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
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

    const passwordHash = await this.passwordService.hash(dto.password);

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
      !(await this.passwordService.verify(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const publicUser = mapUser(user);

    return {
      user: publicUser,
      accessToken: await this.createAccessToken(publicUser),
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
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
