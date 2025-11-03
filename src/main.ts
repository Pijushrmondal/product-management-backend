import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Get config service
  const configService = app.get(ConfigService);

  // Serve static files (uploaded images)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Enable CORS
  app.enableCors({
    origin: true, // In production, replace with your frontend URL
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // ⚙️ Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Product Management API')
    .setDescription(
      'API documentation for user, category, and product management system.',
    )
    .setVersion('1.0')
    .addBearerAuth() // enables JWT auth button
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // keep token after refresh
    },
  });

  // Get port from config
  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);
  console.log(`🚀 Server running at: http://localhost:${port}/api`);
  console.log(
    `📘 Swagger Docs available at: http://localhost:${port}/api/docs`,
  );
}

bootstrap();
