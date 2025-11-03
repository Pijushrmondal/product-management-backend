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
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { SearchPaginationDto } from './dto/category.dto';

@Controller('categories')
@UseGuards(JwtAuthGuard) // Protect all routes with JWT authentication
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Create a new category
   * POST /api/categories
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  /**
   * Get all categories with pagination
   * GET /api/categories?page=1&limit=10
   */
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.categoriesService.findAll(paginationDto);
  }

  /**
   * Get all categories without pagination (for dropdown)
   * GET /api/categories/all/list
   */
  @Get('all/list')
  findAllWithoutPagination() {
    return this.categoriesService.findAllWithoutPagination();
  }

  /**
   * Search categories by name
   * GET /api/categories/search?query=electronics&page=1&limit=10
   */
  @Get('search')
  search(@Query() paginationDto: SearchPaginationDto) {
    return this.categoriesService.search(paginationDto);
  }

  /**
   * Get total categories count
   * GET /api/categories/count/total
   */
  @Get('count/total')
  count() {
    return this.categoriesService.count();
  }

  /**
   * Get category by ID
   * GET /api/categories/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  /**
   * Get category by uniqueId
   * GET /api/categories/unique/:uniqueId
   */
  @Get('unique/:uniqueId')
  findByUniqueId(@Param('uniqueId') uniqueId: string) {
    return this.categoriesService.findByUniqueId(uniqueId);
  }

  /**
   * Update category
   * PATCH /api/categories/:id
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  /**
   * Delete category
   * DELETE /api/categories/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
