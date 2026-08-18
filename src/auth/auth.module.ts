import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { SessionGuard } from './guards/session.guard';
import { APP_GUARD } from '@nestjs/core';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtService } from './services/jwt.service';

@Module({
  providers: [
    AuthService,
    UsersService,
    SessionGuard,
    GoogleStrategy,
    JwtService,
    {
      provide: APP_GUARD,
      useClass: SessionGuard,
    },
  ],
  controllers: [AuthController, UsersController],
})
export class AuthModule {}
