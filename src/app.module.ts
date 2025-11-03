import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { BulkUploadModule } from './modules/bulk-upload/bulk-upload.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [AuthModule, UsersModule, CategoriesModule, ProductsModule, BulkUploadModule, ReportsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
