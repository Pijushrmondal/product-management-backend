import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Generate product report
   * POST /api/reports/generate
   */
  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  async generateReport(@Body() generateReportDto: GenerateReportDto) {
    const job = await this.reportsService.generateReport(generateReportDto);

    return {
      message: 'Report generation started. Processing in background.',
      jobId: job.id,
      status: job.status,
      format: job.format,
      expiresAt: job.expiresAt,
    };
  }

  /**
   * Get report job status
   * GET /api/reports/status/:jobId
   */
  @Get('status/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    return await this.reportsService.getJobStatus(jobId);
  }

  /**
   * Get all report jobs
   * GET /api/reports/jobs
   */
  @Get('jobs')
  async getAllJobs() {
    return await this.reportsService.getAllJobs();
  }

  /**
   * Download report file
   * GET /api/reports/download/:jobId
   */
  @Get('download/:jobId')
  async downloadReport(
    @Param('jobId') jobId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { filePath, fileName } =
      await this.reportsService.downloadReport(jobId);

    const file = createReadStream(filePath);

    res.set({
      'Content-Type': fileName.endsWith('.csv')
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    return new StreamableFile(file);
  }
}
