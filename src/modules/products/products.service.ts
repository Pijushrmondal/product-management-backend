import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto, SortOrder } from './dto/filter-product.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Verify category exists
    await this.categoriesService.findOne(createProductDto.categoryId);

    // Create new product (uniqueId will be generated automatically)
    const product = this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }

  async findAll(
    filterDto: FilterProductDto,
  ): Promise<PaginatedResponse<Product>> {
    const { page, limit, skip, search, categoryId, categoryName, sortByPrice } =
      filterDto;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    // Search by product name
    if (search) {
      queryBuilder.andWhere('product.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // Filter by category ID
    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    // Filter by category name
    if (categoryName) {
      queryBuilder.andWhere('category.name ILIKE :categoryName', {
        categoryName: `%${categoryName}%`,
      });
    }

    // Sort by price
    if (sortByPrice) {
      queryBuilder.orderBy('product.price', sortByPrice);
    } else {
      queryBuilder.orderBy('product.createdAt', 'DESC');
    }

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const [products, total] = await queryBuilder.getManyAndCount();

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findByUniqueId(uniqueId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { uniqueId },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(
        `Product with uniqueId ${uniqueId} not found`,
      );
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // If categoryId is being updated, verify it exists
    if (updateProductDto.categoryId) {
      await this.categoriesService.findOne(updateProductDto.categoryId);
    }

    // Update product
    Object.assign(product, updateProductDto);
    await this.productRepository.save(product);

    // Return updated product with category relation
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    await this.productRepository.remove(product);

    return {
      message: `Product with ID ${id} has been successfully deleted`,
    };
  }

  async count(): Promise<number> {
    return this.productRepository.count();
  }

  async findByCategory(
    categoryId: string,
    filterDto: FilterProductDto,
  ): Promise<PaginatedResponse<Product>> {
    // Verify category exists
    await this.categoriesService.findOne(categoryId);

    const { page, limit, skip, sortByPrice } = filterDto;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.categoryId = :categoryId', { categoryId });

    // Sort by price
    if (sortByPrice) {
      queryBuilder.orderBy('product.price', sortByPrice);
    } else {
      queryBuilder.orderBy('product.createdAt', 'DESC');
    }

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const [products, total] = await queryBuilder.getManyAndCount();

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
