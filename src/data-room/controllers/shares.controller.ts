import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ExtractUser } from '../../auth/decorators/extract-user.decorator';
import { UserEntity } from '../../auth/entities/user.entity';
import { SharesContentDto } from '../dtos/shares-content.dto';
import { SharesCreateDto } from '../dtos/shares-create.dto';
import { FileDownloadEntity } from '../entities/file.entity';
import {
  ShareContentEntity,
  ShareCreatedEntity,
  ShareEntity,
  SharePublicTokenEntity,
  ShareRevocationEntity,
} from '../entities/share.entity';
import { SharesService } from '../services/shares.service';

@ApiTags('Shares')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Bearer token is missing or invalid' })
@Controller('shares')
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @ApiOperation({ summary: 'Create a public or authorized share' })
  @ApiCreatedResponse({
    description:
      'Share created; publicToken is returned once for PUBLIC shares',
    type: ShareCreatedEntity,
  })
  @ApiBadRequestResponse({
    description: 'Target, recipients, or expiry are invalid',
  })
  @Post()
  create(@Body() dto: SharesCreateDto, @ExtractUser() user: UserEntity) {
    return this.sharesService.create(dto, user.id);
  }

  @ApiOperation({ summary: 'List shares created by the current user' })
  @ApiOkResponse({
    description: 'Owned shares returned successfully',
    type: [ShareEntity],
  })
  @Get()
  owned(@ExtractUser() user: UserEntity) {
    return this.sharesService.getOwned(user.id);
  }

  @ApiOperation({ summary: 'List active shares received by the current user' })
  @ApiOkResponse({
    description: 'Received shares returned successfully',
    type: [ShareEntity],
  })
  @Get('received')
  received(@ExtractUser() user: UserEntity) {
    return this.sharesService.getReceived(user.id, user.email);
  }

  @ApiOperation({
    summary: 'Issue a replacement token for an owned public share',
    description: 'The previously issued public token becomes invalid.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({
    description: 'Replacement public token issued successfully',
    type: SharePublicTokenEntity,
  })
  @ApiNotFoundResponse({ description: 'Active owned public share not found' })
  @Post(':id/public-token')
  replacePublicToken(@Param('id') id: string, @ExtractUser() user: UserEntity) {
    return this.sharesService.replacePublicToken(id, user.id);
  }

  @ApiOperation({ summary: 'Browse an authorized share' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({
    description: 'Shared content returned successfully',
    type: ShareContentEntity,
  })
  @ApiNotFoundResponse({ description: 'Active accessible share not found' })
  @Get(':id/content')
  content(
    @Param('id') id: string,
    @Query() dto: SharesContentDto,
    @ExtractUser() user: UserEntity,
  ) {
    return this.sharesService.getAuthorizedContent(
      id,
      dto,
      user.id,
      user.email,
    );
  }

  @ApiOperation({ summary: 'Get a temporary download URL from a share' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'fileId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Temporary download URL returned successfully',
    type: FileDownloadEntity,
  })
  @ApiNotFoundResponse({ description: 'Active share or shared file not found' })
  @Get(':id/files/:fileId/download')
  download(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @ExtractUser() user: UserEntity,
  ) {
    return this.sharesService.getAuthorizedDownload(
      id,
      fileId,
      user.id,
      user.email,
    );
  }

  @ApiOperation({ summary: 'Revoke a share' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({
    description: 'Share revoked successfully',
    type: ShareRevocationEntity,
  })
  @ApiNotFoundResponse({ description: 'Active owned share not found' })
  @Delete(':id')
  revoke(@Param('id') id: string, @ExtractUser() user: UserEntity) {
    return this.sharesService.revoke(id, user.id);
  }
}
