import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { MailingStatus } from '@prisma/client';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from '../prisma.service';
import { CONTACTS_SERVICE } from '../shared/constants/broker';
import { CreateMailingDto } from './dto/create-mailing.dto';
import { UpdateMailingDto } from './dto/update-mailing.dto';
import { Mailing } from './entities/mailing.entity';

@Injectable()
export class MailingService {
  private readonly logger = new Logger(MailingService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly prismaService: PrismaService,
    @Inject(CONTACTS_SERVICE) private readonly client: ClientProxy,
  ) {}

  initialize(projectId: number, token: string): Promise<Record<string, never>> {
    return this.prismaService.project.create({
      data: {
        id: projectId,
        token,
      },
      select: {},
    });
  }

  create(
    projectId: number,
    createMailingDto: CreateMailingDto,
  ): Promise<Mailing> {
    return this.prismaService.mailing.create({
      data: {
        projectId,
        ...createMailingDto,
      },
    });
  }

  findAll(projectId: number): Promise<Mailing[]> {
    return this.prismaService.mailing.findMany({
      where: {
        projectId,
      },
    });
  }

  findOne(projectId: number, id: number): Promise<Mailing> {
    return this.prismaService.mailing.findUniqueOrThrow({
      where: {
        projectId_id: {
          projectId,
          id,
        },
      },
    });
  }

  update(
    projectId: number,
    updateMailingDto: UpdateMailingDto,
  ): Promise<Mailing> {
    return this.prismaService.mailing.update({
      where: {
        projectId_id: {
          projectId,
          id: updateMailingDto.id,
        },
      },
      data: updateMailingDto,
    });
  }

  remove(projectId: number, id: number): Promise<Mailing> {
    return this.prismaService.mailing.delete({
      where: {
        projectId_id: {
          projectId,
          id,
        },
      },
    });
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: MailingService.name,
  })
  async handleCron(): Promise<void> {
    const job = this.schedulerRegistry.getCronJob(MailingService.name);

    job.stop();

    const mailing = await this.prismaService.mailing.findFirst({
      where: {
        scheduledAt: {
          lte: new Date(),
        },
        status: MailingStatus.Scheduled,
      },
      include: {
        project: true,
      },
    });

    if (mailing) {
      const contacts = await lastValueFrom(
        this.client.send<any[]>('contacts.findAllWithTags', {
          headers: {
            authorization: `Bearer ${mailing.project.token}`,
          },
          payload: mailing.tagIds,
        }),
      );

      await this.prismaService.mailingWorker.createMany({
        data: contacts.map((contact) => ({
          contactId: contact.id,
          chatId: contact.chats[0].id,
          mailingId: mailing.id,
          variables: {
            name: contact.name,
          },
        })),
      });

      await this.prismaService.mailing.update({
        where: {
          id: mailing.id,
        },
        data: {
          status: MailingStatus.Active,
        },
      });
    }

    job.start();
  }
}
