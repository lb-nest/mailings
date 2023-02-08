import {
  CacheModule,
  ClassSerializerInterceptor,
  Module,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import Joi from 'joi';
import { MailingWorkerModule } from './mailing-worker/mailing-worker.module';
import { MailingModule } from './mailing/mailing.module';
import { PrismaService } from './prisma.service';
import { CONTACTS_SERVICE, MESSAGING_SERVICE } from './shared/constants/broker';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().uri().required(),
        BROKER_URL: Joi.string().uri().required(),
      }),
    }),
    ScheduleModule.forRoot(),
    CacheModule.register({
      isGlobal: true,
    }),
    ClientsModule.registerAsync([
      {
        name: CONTACTS_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('BROKER_URL')],
            queue: `${CONTACTS_SERVICE}_QUEUE`,
          },
        }),
        inject: [ConfigService],
      },
      {
        name: MESSAGING_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('BROKER_URL')],
            queue: `${MESSAGING_SERVICE}_QUEUE`,
          },
        }),
        inject: [ConfigService],
      },
    ]),
    MailingWorkerModule,
    MailingModule,
  ],
  providers: [
    PrismaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
  exports: [ClientsModule],
})
export class AppModule {}
