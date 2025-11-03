import { Module } from '@nestjs/common';
import { BulkUploadController } from './bulk-upload.controller';
import { BulkUploadService } from './bulk-upload.service';

@Module({
  controllers: [BulkUploadController],
  providers: [BulkUploadService]
})
export class BulkUploadModule {}
