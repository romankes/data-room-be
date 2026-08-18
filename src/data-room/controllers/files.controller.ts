import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { FilesService } from '../services/files.service';
import { FilesListDto } from '../dtos/files-list.dto';
import { ExtractUser } from 'src/auth/decorators/extract-user.decorator';
import { UserEntity } from 'src/auth/entities/user.entity';
import { FilesCreateDto } from '../dtos/files-create.dto';
import { FilesUpdateDto } from '../dtos/files-update.dto';
import { SearchDto } from '../dtos/search.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Files')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Bearer token is missing or invalid' })
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @ApiOperation({ summary: 'List files' })
  @ApiOkResponse({ description: 'Files returned successfully' })
  @Get('')
  list(@Query() dto: FilesListDto, @ExtractUser() user: UserEntity) {
    return this.filesService.getList(dto, user.id);
  }

  @ApiOperation({
    summary: 'Search files by name across the entire data room',
  })
  @ApiOkResponse({ description: 'Matching files returned successfully' })
  @Get('search')
  search(@Query() dto: SearchDto, @ExtractUser() user: UserEntity) {
    return this.filesService.search(dto, user.id);
  }

  @ApiOperation({ summary: 'Get a file by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'File returned successfully' })
  @Get(':id')
  byId(@Param('id') id: string, @ExtractUser() user: UserEntity) {
    return this.filesService.getById(id, user.id);
  }

  @ApiOperation({ summary: 'Get a presigned URL for a direct PDF upload' })
  @ApiCreatedResponse({
    description: 'Direct R2 upload URL created successfully',
  })
  @Post('upload-url')
  createUpload(@ExtractUser() user: UserEntity) {
    return this.filesService.createUpload(user.id);
  }

  @ApiOperation({ summary: 'Verify an uploaded PDF and create its entity' })
  @ApiCreatedResponse({
    description:
      'File created successfully; a numeric suffix is added when its name already exists in the target folder',
  })
  @ApiBadRequestResponse({
    description: 'Upload is missing, invalid, too large, or not a PDF',
  })
  @Post('')
  create(@Body() dto: FilesCreateDto, @ExtractUser() user: UserEntity) {
    return this.filesService.create(dto, user.id);
  }

  @ApiOperation({ summary: 'Get a temporary PDF download URL' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({
    description: 'Temporary download URL returned successfully',
  })
  @Get(':id/download')
  download(@Param('id') id: string, @ExtractUser() user: UserEntity) {
    return this.filesService.getDownloadUrl(id, user.id);
  }

  @ApiOperation({ summary: 'Update a file' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'File updated successfully' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: FilesUpdateDto,
    @ExtractUser() user: UserEntity,
  ) {
    return this.filesService.update(id, dto, user.id);
  }

  @ApiOperation({ summary: 'Delete a file' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'File deleted successfully' })
  @Delete(':id')
  delete(@Param('id') id: string, @ExtractUser() user: UserEntity) {
    return this.filesService.delete(id, user.id);
  }
}
