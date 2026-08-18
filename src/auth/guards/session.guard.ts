import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UsersService } from 'src/auth/services/users.service';
import { JwtService } from '../services/jwt.service';

export const EXTRACTED_USER_KEY = 'extractedUser' as const;

@Injectable()
export class SessionGuard implements CanActivate {
  private readonly logger = new Logger(SessionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Token is not valid');
    }

    const payload = await this.jwtService.parseToken(token);

    const session = await this.userService.getById(payload.sub);

    if (!session) {
      // Clients keep a year-long session cookie, so public routes must tolerate
      // tokens this service cannot resolve (e.g. pre-identity-api Strapi JWTs).
      if (isPublic) {
        return true;
      }

      this.logger.warn({
        msg: 'Rejected request with unresolvable session token',
        path: request.path,
      });

      throw new UnauthorizedException('Invalid or expired session token');
    }

    (request as any)[EXTRACTED_USER_KEY] = session;

    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const auth = request.headers['authorization'];

    return auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  }
}
