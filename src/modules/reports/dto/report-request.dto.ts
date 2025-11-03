import { ReportJobStatus, ReportFormat } from '../entities/report-job.entity';

export class ReportStatusDto {
  id: string;
  format: ReportFormat;
  status: ReportJobStatus;
  filePath?: string;
  downloadUrl?: string;
  totalRecords: number;
  errorMessage?: string;
  filters?: any;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
}
