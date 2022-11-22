import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { MailingWorker, MailingWorkerStatus } from '@prisma/client';
import { Cache } from 'cache-manager';
import Mustache from 'mustache';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from '../prisma.service';
import { MESSAGING_SERVICE } from '../shared/constants/broker';

@Injectable()
export class MailingWorkerService {
  private readonly logger = new Logger(MailingWorkerService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly prismaService: PrismaService,
    @Inject(MESSAGING_SERVICE) private readonly client: ClientProxy,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  findAll(
    projectId: number,
    mailingId: number,
    skip = 0,
    take = 100,
  ): Promise<MailingWorker[]> {
    return this.prismaService.mailingWorker.findMany({
      where: {
        mailing: {
          projectId,
          id: mailingId,
        },
      },
      skip,
      take,
    });
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: MailingWorkerService.name,
  })
  async handleCron(): Promise<void> {
    const job = this.schedulerRegistry.getCronJob(MailingWorkerService.name);

    job.stop();

    const mailingWorkers = await this.prismaService.$transaction(
      async (transactionClient) => {
        const mailingWorkers = await transactionClient.mailingWorker.findMany({
          where: {
            scheduledAt: {
              lte: new Date(),
            },
            status: MailingWorkerStatus.Scheduled,
          },
          take: 100,
          include: {
            mailing: {
              include: {
                project: true,
              },
            },
          },
        });

        await transactionClient.mailingWorker.updateMany({
          where: {
            id: {
              in: mailingWorkers.map(({ id }) => id),
            },
          },
          data: {
            status: MailingWorkerStatus.Active,
          },
        });

        return mailingWorkers;
      },
    );

    for await (const mailingWorker of mailingWorkers) {
      try {
        for await (const hsmId of mailingWorker.mailing.hsmIds) {
          let hsm = await this.cacheManager.get<any>(`hsm:${hsmId}`);
          if (!hsm) {
            hsm = await this.cacheManager.set(
              `hsm:${hsmId}`,
              await lastValueFrom(
                this.client.send<any>('hsm.findOne', {
                  headers: {
                    authorization: `Bearer ${mailingWorker.mailing.project.token}`,
                  },
                  payload: hsmId,
                }),
              ),
            );
          }

          const message = await lastValueFrom(
            this.client.send<any>('chats.createMessage', {
              headers: {
                authorization: `Bearer ${mailingWorker.mailing.project.token}`,
              },
              payload: {
                hsmId: hsm.id,
                text: Mustache.render(hsm.text, mailingWorker.variables),
                attachments: hsm.attachments,
                buttons: hsm.buttons,
                variables: mailingWorker.variables,
              },
            }),
          );

          await this.prismaService.mailingWorker.update({
            where: {
              id: mailingWorker.id,
            },
            data: {
              messageId: message.id,
              status: MailingWorkerStatus.Finished,
            },
          });
        }
      } catch {
        await this.prismaService.mailingWorker.update({
          where: {
            id: mailingWorker.id,
          },
          data: {
            status: MailingWorkerStatus.Failed,
          },
        });
      }
    }

    job.start();
  }
}
