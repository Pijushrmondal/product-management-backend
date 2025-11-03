import {
  IsString,
  IsNumber,
  IsUUID,
  Min,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'Product name must not exceed 200 characters' })
  name?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: 'Price must be a positive number' })
  price?: number;

  @IsUUID('4', { message: 'Invalid category ID' })
  @IsOptional()
  categoryId?: string;
}
