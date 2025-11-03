import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import {
  ReportJob,
  ReportJobStatus,
  ReportFormat,
} from './entities/report-job.entity';
import { Product } from '../products/entities/product.entity';
import { GenerateReportDto } from './dto/generate-report.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as fastCsv from 'fast-csv';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ReportJob)
    private readonly reportJobRepository: Repository<ReportJob>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Start report generation
   */
  async generateReport(
    generateReportDto: GenerateReportDto,
  ): Promise<ReportJob> {
    // Create report job
    const reportJob = this.reportJobRepository.create({
      format: generateReportDto.format || ReportFormat.CSV,
      status: ReportJobStatus.PENDING,
      filters: {
        categoryId: generateReportDto.categoryId,
        categoryName: generateReportDto.categoryName,
        minPrice: generateReportDto.minPrice,
        maxPrice: generateReportDto.maxPrice,
        startDate: generateReportDto.startDate,
        endDate: generateReportDto.endDate,
      },
    });

    const savedJob = await this.reportJobRepository.save(reportJob);

    // Set expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    await this.reportJobRepository.update(savedJob.id, { expiresAt });

    // Process report asynchronously
    this.processReportAsync(savedJob.id, generateReportDto).catch((error) => {
      console.error('Error generating report:', error);
    });

    return savedJob;
  }

  /**
   * Process report generation asynchronously
   */
  private async processReportAsync(
    jobId: string,
    filters: GenerateReportDto,
  ): Promise<void> {
    try {
      // Update job status to processing
      await this.reportJobRepository.update(jobId, {
        status: ReportJobStatus.PROCESSING,
      });

      const job = await this.reportJobRepository.findOne({
        where: { id: jobId },
      });
      if (!job) {
        throw new NotFoundException(`Report job with ID ${jobId} not found`);
      }

      // Fetch products based on filters
      const products = await this.fetchProducts(filters);

      // Update total records
      await this.reportJobRepository.update(jobId, {
        totalRecords: products.length,
      });

      // Generate file based on format
      const filePath = await this.generateFile(job.format, products, jobId);

      // Generate download URL
      const downloadUrl = `/uploads/reports/${path.basename(filePath)}`;

      // Mark job as completed
      await this.reportJobRepository.update(jobId, {
        status: ReportJobStatus.COMPLETED,
        filePath,
        downloadUrl,
        completedAt: new Date(),
      });
    } catch (error) {
      // Mark job as failed
      await this.reportJobRepository.update(jobId, {
        status: ReportJobStatus.FAILED,
        errorMessage: error.message,
        completedAt: new Date(),
      });
    }
  }

  /**
   * Fetch products based on filters
   */
  private async fetchProducts(filters: GenerateReportDto): Promise<Product[]> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    // Filter by category ID
    if (filters.categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    // Filter by category name
    if (filters.categoryName) {
      queryBuilder.andWhere('category.name ILIKE :categoryName', {
        categoryName: `%${filters.categoryName}%`,
      });
    }

    // Filter by price range
    if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
      queryBuilder.andWhere('product.price BETWEEN :minPrice AND :maxPrice', {
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
      });
    } else if (filters.minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', {
        minPrice: filters.minPrice,
      });
    } else if (filters.maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    // Filter by date range
    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere(
        'product.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
      );
    } else if (filters.startDate) {
      queryBuilder.andWhere('product.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    } else if (filters.endDate) {
      queryBuilder.andWhere('product.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    queryBuilder.orderBy('product.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * Generate file (CSV or XLSX)
   */
  private async generateFile(
    format: ReportFormat,
    products: Product[],
    jobId: string,
  ): Promise<string> {
    const reportsDir = path.join(process.cwd(), 'uploads', 'reports');

    // Ensure directory exists
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `products-report-${jobId}.${format}`;
    const filePath = path.join(reportsDir, fileName);

    if (format === ReportFormat.CSV) {
      await this.generateCSV(filePath, products);
    } else {
      await this.generateXLSX(filePath, products);
    }

    return filePath;
  }

  /**
   * Generate CSV file
   */
  private async generateCSV(
    filePath: string,
    products: Product[],
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = fs.createWriteStream(filePath);

      const csvStream = fastCsv.format({ headers: true });

      csvStream.pipe(ws);

      products.forEach((product) => {
        csvStream.write({
          'Product ID': product.id,
          'Unique ID': product.uniqueId,
          'Product Name': product.name,
          Price: product.price,
          'Category ID': product.categoryId,
          'Category Name': product.category?.name || '',
          Image: product.image || '',
          'Created At': product.createdAt,
          'Updated At': product.updatedAt,
        });
      });

      csvStream.end();

      ws.on('finish', () => resolve());
      ws.on('error', (error) => reject(error));
    });
  }

  /**
   * Generate XLSX file
   */
  private async generateXLSX(
    filePath: string,
    products: Product[],
  ): Promise<void> {
    const data = products.map((product) => ({
      'Product ID': product.id,
      'Unique ID': product.uniqueId,
      'Product Name': product.name,
      Price: product.price,
      'Category ID': product.categoryId,
      'Category Name': product.category?.name || '',
      Image: product.image || '',
      'Created At': product.createdAt,
      'Updated At': product.updatedAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

    XLSX.writeFile(workbook, filePath);
  }

  /**
   * Get report job status
   */
  async getJobStatus(jobId: string): Promise<ReportJob> {
    const job = await this.reportJobRepository.findOne({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Report job with ID ${jobId} not found`);
    }

    return job;
  }

  /**
   * Get all report jobs
   */
  async getAllJobs(): Promise<ReportJob[]> {
    return await this.reportJobRepository.find({
      order: { createdAt: 'DESC' },
      take: 50, // Limit to last 50 jobs
    });
  }

  /**
   * Download report file
   */
  async downloadReport(
    jobId: string,
  ): Promise<{ filePath: string; fileName: string }> {
    const job = await this.reportJobRepository.findOne({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Report job with ID ${jobId} not found`);
    }

    if (job.status !== ReportJobStatus.COMPLETED) {
      throw new BadRequestException('Report is not ready yet');
    }

    if (!job.filePath || !fs.existsSync(job.filePath)) {
      throw new NotFoundException('Report file not found');
    }

    // Check if report has expired
    if (job.expiresAt && new Date() > job.expiresAt) {
      throw new BadRequestException('Report has expired');
    }

    return {
      filePath: job.filePath,
      fileName: path.basename(job.filePath),
    };
  }

  /**
   * Delete old expired reports (cleanup)
   */
  async cleanupExpiredReports(): Promise<void> {
    const expiredJobs = await this.reportJobRepository
      .createQueryBuilder('report')
      .where('report.expiresAt < :now', { now: new Date() })
      .andWhere('report.status = :status', {
        status: ReportJobStatus.COMPLETED,
      })
      .getMany();

    for (const job of expiredJobs) {
      // Delete file
      if (job.filePath && fs.existsSync(job.filePath)) {
        fs.unlinkSync(job.filePath);
      }

      // Delete job record
      await this.reportJobRepository.remove(job);
    }
  }
}
