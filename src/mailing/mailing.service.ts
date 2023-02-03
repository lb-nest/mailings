import { Inject, Injectable, Logger } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common/exceptions';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { MailingStatus, MailingWorkerStatus } from '@prisma/client';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from '../prisma.service';
import { CONTACTS_SERVICE } from '../shared/constants/broker';
import { CreateMailingDto } from './dto/create-mailing.dto';
import { UpdateMailingDto } from './dto/update-mailing.dto';
import { Mailing } from './entities/mailing.entity';

@Injectable()
export class MailingService {
  private readonly logger = new Logger(MailingService.name);

  private ALLOWED_STATUSES: string[] = [
    MailingStatus.Disabled,
    MailingStatus.Scheduled,
  ];

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly prismaService: PrismaService,
    @Inject(CONTACTS_SERVICE) private readonly client: ClientProxy,
  ) {}

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

  async update(
    projectId: number,
    updateMailingDto: UpdateMailingDto,
  ): Promise<Mailing> {
    const mailing = await this.findOne(projectId, updateMailingDto.id);

    if (!this.ALLOWED_STATUSES.includes(mailing.status)) {
      throw new ForbiddenException(
        'It is forbidden to change statuses for completed mailings',
      );
    }

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
    this.logger.log('Сhecking for mailings waiting to be sent');

    const job = this.schedulerRegistry.getCronJob(MailingService.name);

    job.stop();

    try {
      const mailing = await this.prismaService.mailing.findFirst({
        where: {
          scheduledAt: {
            lte: new Date(),
          },
          status: MailingStatus.Scheduled,
        },
      });

      if (mailing) {
        const contacts = await lastValueFrom(
          this.client.send<any[]>('findAllContactsForMailing', {
            projectId: mailing.projectId,
            tagIds: mailing.tagIds,
            channelId: mailing.channelId,
          }),
        );

        this.logger.log(
          `${contacts.length} contacts affected by the mailing were found`,
          mailing,
        );

        await this.prismaService.mailing.update({
          where: {
            id: mailing.id,
          },
          data: {
            status: MailingStatus.Active,
            workers: {
              createMany: {
                data: contacts.map(({ contactId, accountId, contact }) => ({
                  contactId,
                  accountId,
                  variables: contact,
                })),
              },
            },
          },
        });
      }

      await this.prismaService.mailing.updateMany({
        where: {
          status: MailingStatus.Active,
          workers: {
            every: {
              status: {
                in: [MailingWorkerStatus.Failed, MailingWorkerStatus.Finished],
              },
            },
          },
        },
        data: {
          status: MailingStatus.Finished,
        },
      });
    } catch (e) {
      this.logger.error('Error when processing mailings', e);
    } finally {
      job.start();
    }
  }
}
