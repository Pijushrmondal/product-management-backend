import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsUUID,
  Min,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Product name is required' })
  @MaxLength(200, { message: 'Product name must not exceed 200 characters' })
  name: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsNumber()
  @IsNotEmpty({ message: 'Price is required' })
  @Type(() => Number)
  @Min(0, { message: 'Price must be a positive number' })
  price: number;

  @IsUUID('4', { message: 'Invalid category ID' })
  @IsNotEmpty({ message: 'Category ID is required' })
  categoryId: string;
}
