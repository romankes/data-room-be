import { Controller, Get } from '@nestjs/common';
import { ExtractUser } from '../decorators/extract-user.decorator';
import { UserEntity } from '../entities/user.entity';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Bearer token is missing or invalid' })
@Controller('users')
export class UsersController {
  @ApiOperation({ summary: 'Get the current user' })
  @ApiOkResponse({ type: UserEntity })
  @Get('me')
  me(@ExtractUser() user: UserEntity) {
    return user;
  }
}
