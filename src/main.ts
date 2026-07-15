import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // graphql-upload cung cấp middleware và scalar theo GraphQL multipart request specification; 
  // giá trị resolver nhận được chứa stream để lưu file vào filesystem hoặc cloud storage
  const graphqlUploadExpressModule =
    await import('graphql-upload/graphqlUploadExpress.mjs');

  const graphqlUploadExpress =
    graphqlUploadExpressModule.default;

  app.use(
    '/graphql',
    graphqlUploadExpress({
      maxFileSize: 5 * 1024 * 1024, // Giới hạn ảnh tối đa 5 MB
      maxFiles: 1, // Mỗi request chỉ được upload một ảnh.
    }),
  );

  app.useStaticAssets(
    join(process.cwd(), 'uploads'),
    {
      prefix: '/uploads/',
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự loại bỏ fields thừa
      transform: true
    })
  )
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
