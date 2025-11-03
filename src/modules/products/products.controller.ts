import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { multerConfig } from '../../config/multer.config';

@Controller('products')
@UseGuards(JwtAuthGuard) // Protect all routes with JWT authentication
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Create a new product
   * POST /api/products
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  /**
   * Create a product with image upload
   * POST /api/products/upload
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image', multerConfig))
  createWithImage(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      createProductDto.image = `/uploads/products/${file.filename}`;
    }
    return this.productsService.create(createProductDto);
  }

  /**
   * Get all products with filtering, searching, sorting, and pagination
   * GET /api/products?page=1&limit=10&search=laptop&categoryId=xxx&sortByPrice=ASC
   */
  @Get()
  findAll(@Query() filterDto: FilterProductDto) {
    return this.productsService.findAll(filterDto);
  }

  /**
   * Get products by category
   * GET /api/products/category/:categoryId?page=1&limit=10&sortByPrice=DESC
   */
  @Get('category/:categoryId')
  findByCategory(
    @Param('categoryId') categoryId: string,
    @Query() filterDto: FilterProductDto,
  ) {
    return this.productsService.findByCategory(categoryId, filterDto);
  }

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  /**
   * Get product by uniqueId
   * GET /api/products/unique/:uniqueId
   */
  @Get('unique/:uniqueId')
  findByUniqueId(@Param('uniqueId') uniqueId: string) {
    return this.productsService.findByUniqueId(uniqueId);
  }

  /**
   * Update product
   * PATCH /api/products/:id
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  /**
   * Update product with image upload
   * PATCH /api/products/:id/upload
   */
  @Patch(':id/upload')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  updateWithImage(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      updateProductDto.image = `/uploads/products/${file.filename}`;
    }
    return this.productsService.update(id, updateProductDto);
  }

  /**
   * Delete product
   * DELETE /api/products/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
