import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { type TConfiguration } from './configuration';

@Injectable()
export class ConfigurationService {
  constructor(private readonly configService: ConfigService) {}

  public get<TKey extends keyof TConfiguration>(
    propName: TKey,
  ): TConfiguration[TKey] {
    return this.configService.get(propName) as TConfiguration[TKey];
  }
}
