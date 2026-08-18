import { Module } from '@nestjs/common';
import { FoldersController } from './controllers/folders.controller';
import { FoldersService } from './services/folders.service';
import { FilesController } from './controllers/files.controller';
import { FilesService } from './services/files.service';
import { ConfigModule } from '@nestjs/config';
import { StorageConfigFactory } from '../config/storage.config';
import { FileStorageService } from './services/file-storage.service';

@Module({
  imports: [ConfigModule.forFeature(StorageConfigFactory)],
  controllers: [FoldersController, FilesController],
  providers: [FoldersService, FilesService, FileStorageService],
})
export class DataRoomModule {}
