import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { EXTRACTED_USER_KEY } from '../guards/session.guard';
import { UserEntity } from 'src/auth/entities/user.entity';

export const ExtractUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserEntity => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request as any)[EXTRACTED_USER_KEY] as UserEntity;
  },
);
