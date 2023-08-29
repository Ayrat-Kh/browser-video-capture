import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';

import { AppModule } from './app.module';
import { ConfigurationService } from './config/configuration.service';
import { ImageServiceSocketProvider } from './providers/ImageServiceSocketProvider';
import { ImageServiceSocketProviderStrategy } from './providers/ImageServiceSocketProviderStrategy';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: ['error', 'log', 'verbose'],
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
