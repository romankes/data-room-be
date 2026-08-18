import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService as InternalJwtService } from '@nestjs/jwt';

export interface JwtPayload {
  sub: string;
}

@Injectable()
export class JwtService {
  constructor(private readonly jwtService: InternalJwtService) {}

  async createToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  async parseToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
