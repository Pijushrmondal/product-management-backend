import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    CategoriesModule, // Import to use CategoriesService
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService], // Export for use in other modules
})
export class ProductsModule {}
