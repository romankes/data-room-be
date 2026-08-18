import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  GoogleConfigFactory,
  JWT_CONFIG,
  JwtConfig,
  JwtConfigFactory,
  ServerConfigFactory,
} from './config';
import { JwtModule } from '@nestjs/jwt';
import { DataRoomModule } from './data-room/data-room.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [ServerConfigFactory, JwtConfigFactory, GoogleConfigFactory],
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const jwt = config.getOrThrow<JwtConfig>(JWT_CONFIG);

        return {
          secret: jwt.secret,
          signOptions: { expiresIn: '30d' },
        };
      },
    }),
    PrismaModule,
    AuthModule,
    DataRoomModule,
  ],
})
export class AppModule {}
