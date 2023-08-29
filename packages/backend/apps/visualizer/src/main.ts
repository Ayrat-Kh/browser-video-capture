import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { ConfigurationService } from './config/configuration.service';
import { Logger } from '@nestjs/common';

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

  await app.listen(configService.get('appPort'));
}
bootstrap();
