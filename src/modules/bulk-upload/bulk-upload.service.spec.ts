import { Test, TestingModule } from '@nestjs/testing';
import { BulkUploadService } from './bulk-upload.service';

describe('BulkUploadService', () => {
  let service: BulkUploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BulkUploadService],
    }).compile();

    service = module.get<BulkUploadService>(BulkUploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
