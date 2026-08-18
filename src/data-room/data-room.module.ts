import { Module } from '@nestjs/common';
import { FoldersController } from './controllers/folders.controller';
import { FoldersService } from './services/folders.service';
import { FilesController } from './controllers/files.controller';
import { FilesService } from './services/files.service';

@Module({
  controllers: [FoldersController, FilesController],
  providers: [FoldersService, FilesService],
})
export class DataRoomModule {}
