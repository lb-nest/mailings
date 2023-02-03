import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { MailingWorker, MailingWorkerStatus } from '@prisma/client';
import { Cache } from 'cache-manager';
import * as Mustache from 'mustache';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from '../prisma.service';
import { MESSAGING_SERVICE } from '../shared/constants/broker';
import { FindAllMailingWorkersDto } from './dto/find-all-mailing-workers.dto';

@Injectable()
export class MailingWorkerService {
  private readonly logger = new Logger(MailingWorkerService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly prismaService: PrismaService,
    @Inject(MESSAGING_SERVICE) private readonly client: ClientProxy,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  findAll(
    projectId: number,
    findAllMailingWorkersDto: FindAllMailingWorkersDto,
  ): Promise<MailingWorker[]> {
    return this.prismaService.mailingWorker.findMany({
      where: {
        mailing: {
          projectId,
          id: findAllMailingWorkersDto.mailingId,
        },
      },
      skip: findAllMailingWorkersDto.skip,
      take: findAllMailingWorkersDto.take,
    });
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: MailingWorkerService.name,
  })
  async handleCron(): Promise<void> {
    this.logger.log('Сhecking for mailing workers waiting to be sent');

    const job = this.schedulerRegistry.getCronJob(MailingWorkerService.name);

    job.stop();

    try {
      const mailingWorkers = await this.prismaService.$transaction(
        async (tx) => {
          const mailingWorkers = await tx.mailingWorker.findMany({
            where: {
              scheduledAt: {
                lte: new Date(),
              },
              status: MailingWorkerStatus.Scheduled,
            },
            take: 100,
            include: {
              mailing: true,
            },
          });

          await tx.mailingWorker.updateMany({
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

      this.logger.log(`${mailingWorkers.length} mailing workers found`);

      for await (const mailingWorker of mailingWorkers) {
        try {
          for await (const id of mailingWorker.mailing.hsmIds) {
            let hsm = await this.cache.get<any>(id.toString());
            if (!hsm) {
              hsm = await this.cache.set(
                id.toString(),
                await lastValueFrom(
                  this.client.send<any>('findOneHsm', {
                    projectId: mailingWorker.mailing.projectId,
                    id,
                  }),
                ),
              );
            }

            const message = await lastValueFrom(
              this.client.send<any>('createMessage', {
                projectId: mailingWorker.mailing.projectId,
                channelId: mailingWorker.mailing.channelId,
                accountId: mailingWorker.accountId,
                hsmId: hsm.id,
                text: Mustache.render(hsm.text, mailingWorker.variables),
                attachments: hsm.attachments,
                buttons: hsm.buttons,
                variables: mailingWorker.variables,
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
        } catch (error) {
          this.logger.error('Error when sending mailing worker', {
            error,
            mailingWorker,
          });

          await this.prismaService.mailingWorker.update({
            where: {
              id: mailingWorker.id,
            },
            data: {
              status: MailingWorkerStatus.Failed,
              failedReason: error?.message,
            },
          });
        }
      }
    } catch (e) {
      this.logger.error('Error when processing mailing workers', e);
    } finally {
      job.start();
    }
  }
}
