import {
  IsEnum,
  IsOptional,
  IsUUID,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReportFormat } from '../entities/report-job.entity';

export class GenerateReportDto {
  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat = ReportFormat.CSV;

  @IsUUID('4', { message: 'Invalid category ID' })
  @IsOptional()
  categoryId?: string;

  @IsOptional()
  categoryName?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minPrice?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  maxPrice?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
