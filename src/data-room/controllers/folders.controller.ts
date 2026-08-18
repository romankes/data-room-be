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
import { FoldersService } from '../services/folders.service';
import { FoldersListDto } from '../dtos/folders-list.dto';
import { UserEntity } from 'src/auth/entities/user.entity';
import { ExtractUser } from 'src/auth/decorators/extract-user.decorator';
import { FoldersCreateDto } from '../dtos/folders-create.dto';
import { FoldersUpdateDto } from '../dtos/folders-update.dto';
import { SearchDto } from '../dtos/search.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FolderEntity } from '../entities/folder.entity';

@ApiTags('Folders')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Bearer token is missing or invalid' })
@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @ApiOperation({ summary: 'List folders' })
  @ApiOkResponse({
    description: 'Folders returned successfully',
    type: [FolderEntity],
  })
  @Get('')
  list(@Query() dto: FoldersListDto, @ExtractUser() user: UserEntity) {
    return this.foldersService.getList(dto, user.id);
  }

  @ApiOperation({
    summary: 'Search folders by name across the entire data room',
  })
  @ApiOkResponse({
    description: 'Matching folders returned successfully',
    type: [FolderEntity],
  })
  @Get('search')
  search(@Query() dto: SearchDto, @ExtractUser() user: UserEntity) {
    return this.foldersService.search(dto, user.id);
  }

  @ApiOperation({ summary: 'Get a folder by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({
    description: 'Folder returned successfully',
    type: FolderEntity,
  })
  @Get(':id')
  byId(@Param('id') id: string, @ExtractUser() user: UserEntity) {
    return this.foldersService.getById(id, user.id);
  }

  @ApiOperation({ summary: 'Create a folder' })
  @ApiCreatedResponse({
    description: 'Folder created successfully',
    type: FolderEntity,
  })
  @Post('')
  create(@Body() dto: FoldersCreateDto, @ExtractUser() user: UserEntity) {
    return this.foldersService.create(dto, user.id);
  }

  @ApiOperation({ summary: 'Update a folder' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({
    description: 'Folder updated successfully',
    type: FolderEntity,
  })
  @Patch(':id')
  update(
    @Body() dto: FoldersUpdateDto,
    @Param('id') id: string,
    @ExtractUser() user: UserEntity,
  ) {
    return this.foldersService.update(id, dto, user.id);
  }

  @ApiOperation({ summary: 'Delete a folder' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Folder deleted successfully' })
  @Delete(':id')
  delete(@Param('id') id: string, @ExtractUser() user: UserEntity) {
    return this.foldersService.delete(id, user.id);
  }
}
