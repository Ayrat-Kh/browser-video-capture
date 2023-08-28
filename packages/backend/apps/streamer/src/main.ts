import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';

import { AppModule } from './app.module';
import { ConfigurationService } from './config/configuration.service';
import { ImageServiceSocketProvider } from './providers/ImageServiceSocketProvider';
import { ImageServiceSocketProviderStrategy } from './providers/ImageServiceSocketProviderStrategy';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  const configService = app.get<ConfigurationService>(ConfigurationService);

  console.log('config', JSON.stringify(configService, null, 2));

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
