import Prisma from '@prisma/client';
import { Exclude } from 'class-transformer';

export class MailingWorker implements Prisma.MailingWorker {
  id: number;

  @Exclude()
  mailingId: number;

  contactId: number;

  chatId: number;

  messageId: number;

  @Exclude()
  variables: any;

  scheduledAt: Date;

  status: Prisma.MailingWorkerStatus;
}
