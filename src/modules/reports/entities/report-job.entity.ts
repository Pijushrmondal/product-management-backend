import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ReportJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ReportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
}

@Entity('report_jobs')
export class ReportJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ReportFormat,
    default: ReportFormat.CSV,
  })
  format: ReportFormat;

  @Column({
    type: 'enum',
    enum: ReportJobStatus,
    default: ReportJobStatus.PENDING,
  })
  status: ReportJobStatus;

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  downloadUrl: string;

  @Column({ type: 'int', default: 0 })
  totalRecords: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'json', nullable: true })
  filters: {
    categoryId?: string;
    categoryName?: string;
    minPrice?: number;
    maxPrice?: number;
    startDate?: string;
    endDate?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date; // Report file expiration (e.g., 24 hours)
}
