import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTH_SERVICE } from '../shared/constants/broker';
import { BearerStrategy } from './bearer.strategy';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('BROKER_URL')],
            queue: `${AUTH_SERVICE}_QUEUE`,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [BearerStrategy],
})
export class AuthModule {}
