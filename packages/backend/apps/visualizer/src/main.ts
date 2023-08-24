import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { ConfigurationService } from './config/configuration.service';
import { VisualizerService } from './visualizer/visualizer.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  const configService: ConfigurationService = app.get(ConfigurationService);
  app.get(VisualizerService);

  await app.listen(configService.get('appPort'));
}
bootstrap();
