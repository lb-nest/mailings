import { forwardRef, Module } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma.service';
import { MailingWorkerController } from './mailing-worker.controller';
import { MailingWorkerService } from './mailing-worker.service';

@Module({
  imports: [forwardRef(() => AppModule)],
  controllers: [MailingWorkerController],
  providers: [PrismaService, MailingWorkerService],
})
export class MailingWorkerModule {}
