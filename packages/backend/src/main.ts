import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  console.log('ENVIRONMENT', process.env.ENVIRONMENT);

  await app.listen(3001);
}
bootstrap();
