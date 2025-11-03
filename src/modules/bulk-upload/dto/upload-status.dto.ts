import { UploadJobStatus } from '../entities/upload-job.entity';

export class UploadStatusDto {
  id: string;
  fileName: string;
  status: UploadJobStatus;
  processedRows: number;
  totalRows: number;
  successCount: number;
  failedCount: number;
  errorMessage?: string;
  errors?: Array<{ row: number; error: string }>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  progress?: number;
}
