import Prisma from '@prisma/client';
import { Exclude } from 'class-transformer';

export class MailingWorker implements Prisma.MailingWorker {
  id: number;

  @Exclude()
  mailingId: number;

  contactId: number;

  accountId: string;

  messageId: number | null;

  @Exclude()
  variables: any;

  scheduledAt: Date;

  status: Prisma.MailingWorkerStatus;

  failedReason: string | null;
}
