import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Category name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Category name must not exceed 100 characters' })
  name?: string;
}
