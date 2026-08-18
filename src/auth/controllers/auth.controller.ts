import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiFoundResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { type CookieOptions, type Request, type Response } from 'express';
import { GoogleConfigFactory } from '../../config/google.config';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_MAX_AGE,
} from '../auth.constants';
import { Public } from '../decorators/public.decorator';
import { EmailAuthDto } from '../dtos/email-auth.dto';
import { UserEntity } from '../entities/user.entity';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { AuthService } from '../services/auth.service';

type GoogleAuthenticatedRequest = Request & { user: UserEntity };

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(GoogleConfigFactory.KEY)
    private readonly googleConfig: ConfigType<typeof GoogleConfigFactory>,
  ) {}

  @Public()
  @ApiOperation({ summary: 'Register with email and password' })
  @ApiCreatedResponse({ type: UserEntity })
  @ApiConflictResponse({ description: 'Email is already registered' })
  @Post('register')
  async register(
    @Body() dto: EmailAuthDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserEntity> {
    const result = await this.authService.register(dto);

    this.setAccessTokenCookie(response, result.accessToken);

    return result.user;
  }

  @Public()
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiOkResponse({ type: UserEntity })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: EmailAuthDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserEntity> {
    const result = await this.authService.login(dto);

    this.setAccessTokenCookie(response, result.accessToken);

    return result.user;
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Start Google OAuth login' })
  @ApiFoundResponse({ description: 'Redirects to the Google login page' })
  @Get('google')
  googleLogin(): void {}

  @Public()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Handle the Google OAuth callback' })
  @ApiFoundResponse({ description: 'Sets the auth cookie and redirects' })
  @Get('google/callback')
  async googleCallback(
    @Req() request: GoogleAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<void> {
    const accessToken = await this.authService.createAccessToken(request.user);

    this.setAccessTokenCookie(response, accessToken);
    response.redirect(this.googleConfig.successRedirectUrl);
  }

  @ApiBearerAuth()
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE)
  @ApiOperation({ summary: 'Log out the current user' })
  @ApiNoContentResponse({ description: 'Auth cookie removed successfully' })
  @ApiUnauthorizedResponse({ description: 'The current session is invalid' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE, this.getCookieOptions());
  }

  private setAccessTokenCookie(response: Response, accessToken: string): void {
    response.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...this.getCookieOptions(),
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
    });
  }

  private getCookieOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      httpOnly: true,
      path: '/',
      // Separate Vercel projects are cross-site even though both use
      // `vercel.app`, so production cookies must explicitly allow cross-site
      // requests. `SameSite=None` is only accepted together with `Secure`.
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
    };
  }
}
