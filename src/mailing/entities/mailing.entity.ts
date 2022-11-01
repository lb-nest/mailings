import Prisma from '@prisma/client';
import { Exclude } from 'class-transformer';

export class Mailing implements Prisma.Mailing {
  id: number;

  @Exclude()
  projectId: number;

  name: string;

  description: string;

  color: string;

  tagIds: number[];

  hsmIds: number[];

  status: Prisma.MailingStatus;

  scheduledAt: Date | null;

  createdAt: Date;

  updatedAt: Date;
}
