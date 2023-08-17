import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TConfiguration } from './configuration';

@Injectable()
export class ConfigurationService {
  constructor(private readonly configService: ConfigService) {}

  public get<TReturn = string>(propName: keyof TConfiguration): TReturn {
    return this.configService.get(propName);
  }
}
