import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { SearchPaginationDto } from './dto/category.dto';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Check if category with same name already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    // Create new category (uniqueId will be generated automatically)
    const category = this.categoryRepository.create(createCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Category>> {
    const { page, limit, skip } = paginationDto;

    const [categories, total] = await this.categoryRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: categories,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllWithoutPagination(): Promise<Category[]> {
    return await this.categoryRepository.find({
      order: { name: 'ASC' },
    });
  }

  async search(
    paginationDto: SearchPaginationDto,
  ): Promise<PaginatedResponse<Category>> {
    const { page, limit, skip, query } = paginationDto;

    const [categories, total] = await this.categoryRepository.findAndCount({
      where: {
        name: ILike(`%${query}%`),
      },
      skip,
      take: limit,
      order: { name: 'ASC' },
    });

    return {
      data: categories,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findByUniqueId(uniqueId: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { uniqueId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with uniqueId ${uniqueId} not found`,
      );
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // If name is being updated, check if it's already taken
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });

      if (existingCategory) {
        throw new ConflictException('Category name is already taken');
      }
    }

    // Update category
    Object.assign(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<{ message: string }> {
    const category = await this.categoryRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // TODO: Check if category has products before deleting
    // This will be implemented when we add the products module

    await this.categoryRepository.remove(category);

    return {
      message: `Category with ID ${id} has been successfully deleted`,
    };
  }

  async dashboardSummery(): Promise<any> {
    return {
      categoryCount: await this.categoryRepository.count(),
      productCount: await this.productRepository.count(),
    };
  }
}
