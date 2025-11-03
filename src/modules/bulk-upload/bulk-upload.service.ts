import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadJob, UploadJobStatus } from './entities/upload-job.entity';
import { Product } from '../products/entities/product.entity';
import { CategoriesService } from '../categories/categories.service';
import * as fs from 'fs';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

interface ProductRow {
  name: string;
  price: string | number;
  categoryId?: string;
  categoryName?: string;
  image?: string;
}

@Injectable()
export class BulkUploadService {
  constructor(
    @InjectRepository(UploadJob)
    private readonly uploadJobRepository: Repository<UploadJob>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async startUpload(file: Express.Multer.File): Promise<UploadJob> {
    // Validate file type
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        'Invalid file type. Only CSV and XLSX files are allowed',
      );
    }

    // Create upload job
    const uploadJob = this.uploadJobRepository.create({
      fileName: file.originalname,
      status: UploadJobStatus.PENDING,
    });

    const savedJob = await this.uploadJobRepository.save(uploadJob);

    // Process file asynchronously
    this.processFileAsync(savedJob.id, file.path, fileExtension).catch(
      (error) => {
        console.error('Error processing file:', error);
      },
    );

    return savedJob;
  }

  private async processFileAsync(
    jobId: string,
    filePath: string,
    fileExtension: string,
  ): Promise<void> {
    try {
      // Update job status to processing
      await this.uploadJobRepository.update(jobId, {
        status: UploadJobStatus.PROCESSING,
      });

      let rows: ProductRow[] = [];

      // Parse file based on extension
      if (fileExtension === '.csv') {
        rows = await this.parseCSV(filePath);
      } else {
        rows = await this.parseExcel(filePath);
      }

      // Update total rows
      await this.uploadJobRepository.update(jobId, {
        totalRows: rows.length,
      });

      // Process rows in batches
      await this.processRows(jobId, rows);

      // Mark job as completed
      await this.uploadJobRepository.update(jobId, {
        status: UploadJobStatus.COMPLETED,
        completedAt: new Date(),
      });

      // Delete uploaded file
      fs.unlinkSync(filePath);
    } catch (error) {
      // Mark job as failed
      await this.uploadJobRepository.update(jobId, {
        status: UploadJobStatus.FAILED,
        errorMessage: error.message,
        completedAt: new Date(),
      });

      // Delete uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  private async parseCSV(filePath: string): Promise<ProductRow[]> {
    return new Promise((resolve, reject) => {
      const rows: ProductRow[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: Record<string, string>) => {
          rows.push(row as unknown as ProductRow);
        })
        .on('end', () => {
          resolve(rows);
        })
        .on('error', (error: Error) => {
          reject(error);
        });
    });
  }

  private async parseExcel(filePath: string): Promise<ProductRow[]> {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: ProductRow[] = XLSX.utils.sheet_to_json(sheet);
    return rows;
  }

  private async processRows(jobId: string, rows: ProductRow[]): Promise<void> {
    const batchSize = 500;
    const errors: Array<{ row: number; error: string }> = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const productsToInsert: Partial<Product>[] = [];

      for (let j = 0; j < batch.length; j++) {
        const rowIndex = i + j + 1;
        const row = batch[j];

        try {
          // Validate row data
          if (!row.name || !row.price) {
            throw new Error('Name and price are required');
          }

          // Get category ID
          let categoryId = row.categoryId;

          // If categoryName is provided, find category by name
          if (!categoryId && row.categoryName) {
            try {
              const categories =
                await this.categoriesService.findAllWithoutPagination();
              const category = categories.find(
                (cat) =>
                  cat.name.toLowerCase() === row?.categoryName?.toLowerCase(),
              );

              if (!category) {
                throw new Error(`Category '${row.categoryName}' not found`);
              }

              categoryId = category.id;
            } catch (error) {
              throw new Error(`Invalid category: ${error.message}`);
            }
          }

          if (!categoryId) {
            throw new Error('Category ID or Category Name is required');
          }

          // Verify category exists
          await this.categoriesService.findOne(categoryId);

          // Prepare product data
          const product: Partial<Product> = {
            name: row.name,
            price: parseFloat(row.price.toString()),
            categoryId,
            image: row?.image || '',
            uniqueId: uuidv4(),
          };

          productsToInsert.push(product);
          successCount++;
        } catch (error) {
          errors.push({
            row: rowIndex,
            error: error.message,
          });
          failedCount++;
        }
      }

      // Batch insert products
      if (productsToInsert.length > 0) {
        await this.productRepository.save(productsToInsert);
      }

      // Update job progress
      await this.uploadJobRepository.update(jobId, {
        processedRows: Math.min(i + batchSize, rows.length),
        successCount,
        failedCount,
        errors: errors.length > 0 ? errors : undefined,
      });
    }
  }

  async getJobStatus(jobId: string): Promise<UploadJob> {
    const job = await this.uploadJobRepository.findOne({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Upload job with ID ${jobId} not found`);
    }

    return job;
  }

  async getAllJobs(): Promise<UploadJob[]> {
    return await this.uploadJobRepository.find({
      order: { createdAt: 'DESC' },
      take: 50, // Limit to last 50 jobs
    });
  }

  async cleanupOldJobs(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await this.uploadJobRepository
      .createQueryBuilder()
      .delete()
      .where('status IN (:...statuses)', {
        statuses: [UploadJobStatus.COMPLETED, UploadJobStatus.FAILED],
      })
      .andWhere('completedAt < :cutoffDate', { cutoffDate })
      .execute();
  }
}
