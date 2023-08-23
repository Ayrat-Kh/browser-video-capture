import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigurationService } from './config/configuration.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  const configService: ConfigurationService = app.get(ConfigurationService);

  await app.listen(configService.get('appPort'));
}
bootstrap();
