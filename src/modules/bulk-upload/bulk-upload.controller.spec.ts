import { Test, TestingModule } from '@nestjs/testing';
import { BulkUploadController } from './bulk-upload.controller';

describe('BulkUploadController', () => {
  let controller: BulkUploadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BulkUploadController],
    }).compile();

    controller = module.get<BulkUploadController>(BulkUploadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
