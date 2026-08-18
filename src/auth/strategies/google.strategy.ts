import { Inject, Injectable } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { GoogleConfigFactory } from '../../config/google.config';
import { UsersService } from '../services/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(GoogleConfigFactory.KEY)
    config: ConfigType<typeof GoogleConfigFactory>,
    private readonly usersService: UsersService,
  ) {
    super({
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackUrl,
      scope: ['email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      done(new Error('Google account email is not available'), undefined);
      return;
    }

    try {
      const result = await this.usersService.findOrCreate(email);
      done(null, result);
    } catch (err) {
      done(err as Error, undefined);
    }
  }
}
