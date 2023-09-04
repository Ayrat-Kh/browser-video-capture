import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

import { AppModule } from './app.module';
import { ConfigurationService } from './config/configuration.service';
import { ImageServiceSocketProvider } from './providers/ImageServiceSocketProvider';
import { ImageServiceSocketProviderStrategy } from './providers/ImageServiceSocketProviderStrategy';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  const logger = new Logger('bootstrap');
  const configService = app.get<ConfigurationService>(ConfigurationService);

  const internals = configService as any;
  logger.verbose(
    `[config]: ${JSON.stringify(
      internals.configService.internalConfig,
      null,
      2,
    )}`,
  );

  const imageSocketProvider = app.get<ImageServiceSocketProvider>(
    ImageServiceSocketProvider,
  );

  app.connectMicroservice<MicroserviceOptions>({
    strategy: new ImageServiceSocketProviderStrategy(imageSocketProvider),
  });
  await app.startAllMicroservices();
  await app.listen(configService.get('appPort'));
}
bootstrap();
