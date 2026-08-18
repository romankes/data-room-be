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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
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

  @ApiOperation({ summary: 'Get a file by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'File returned successfully' })
  @Get(':id')
  byId(@Param('id') id: string, @ExtractUser() user: UserEntity) {
    return this.filesService.getById(id, user.id);
  }

  @ApiOperation({ summary: 'Create a file' })
  @ApiCreatedResponse({ description: 'File created successfully' })
  @Post('')
  create(@Body() dto: FilesCreateDto, @ExtractUser() user: UserEntity) {
    return this.filesService.create(dto, user.id);
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
