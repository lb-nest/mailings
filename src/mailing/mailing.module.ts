import { forwardRef, Module } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma.service';
import { MailingController } from './mailing.controller';
import { MailingService } from './mailing.service';

@Module({
  imports: [forwardRef(() => AppModule)],
  controllers: [MailingController],
  providers: [PrismaService, MailingService],
})
export class MailingModule {}
