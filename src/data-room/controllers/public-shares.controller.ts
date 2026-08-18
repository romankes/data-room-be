import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { SharesContentDto } from '../dtos/shares-content.dto';
import { FileDownloadEntity } from '../entities/file.entity';
import { ShareContentEntity } from '../entities/share.entity';
import { SharesService } from '../services/shares.service';

@ApiTags('Public shares')
@Public()
@Controller('public/shares')
export class PublicSharesController {
  constructor(private readonly sharesService: SharesService) {}

  @ApiOperation({ summary: 'Browse a public share by its secret token' })
  @ApiParam({ name: 'token', description: 'Public token returned at creation' })
  @ApiOkResponse({
    description: 'Shared content returned successfully',
    type: ShareContentEntity,
  })
  @ApiBadRequestResponse({ description: 'The browse request is invalid' })
  @ApiNotFoundResponse({ description: 'Active public share not found' })
  @Get(':token/content')
  content(@Param('token') token: string, @Query() dto: SharesContentDto) {
    return this.sharesService.getPublicContent(token, dto);
  }

  @ApiOperation({
    summary: 'Get a temporary download URL from a public share',
  })
  @ApiParam({ name: 'token', description: 'Public token returned at creation' })
  @ApiParam({ name: 'fileId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Temporary download URL returned successfully',
    type: FileDownloadEntity,
  })
  @ApiNotFoundResponse({ description: 'Active share or shared file not found' })
  @Get(':token/files/:fileId/download')
  download(@Param('token') token: string, @Param('fileId') fileId: string) {
    return this.sharesService.getPublicDownload(token, fileId);
  }
}
