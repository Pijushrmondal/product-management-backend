import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class FilterProductDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string; // Search by product name

  @IsOptional()
  @IsUUID('4', { message: 'Invalid category ID' })
  categoryId?: string; // Filter by category

  @IsOptional()
  @IsString()
  categoryName?: string; // Filter by category name

  @IsOptional()
  @IsEnum(SortOrder)
  sortByPrice?: SortOrder; // Sort by price ASC or DESC
}
