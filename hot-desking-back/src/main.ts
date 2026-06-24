import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { config, setupSwagger } from './common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: config.frontend.baseUrl,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  if (config.env !== 'production') {
    setupSwagger(app);
  }

  await app.listen(config.port);
}
bootstrap();
