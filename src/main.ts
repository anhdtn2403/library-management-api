import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
  app.useGlobalInterceptors(
    new ResponseInterceptor()
  );
  app.useGlobalFilters(
    new HttpExceptionFilter(),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
