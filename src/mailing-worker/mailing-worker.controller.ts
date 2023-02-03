import { Controller, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PlainToClassInterceptor } from '../shared/interceptors/plain-to-class.interceptor';
import { FindAllMailingWorkersDto } from './dto/find-all-mailing-workers.dto';
import { MailingWorker } from './entities/mailing-worker.entity';
import { MailingWorkerService } from './mailing-worker.service';

@Controller()
export class MailingWorkerController {
  constructor(private readonly mailingWorkerService: MailingWorkerService) {}

  @MessagePattern('findAllMailingWorkers')
  @UseInterceptors(new PlainToClassInterceptor(MailingWorker))
  findAll(
    @Payload('projectId', ParseIntPipe) projectId: number,
    @Payload() findAllMailingWorkersDto: FindAllMailingWorkersDto,
  ): Promise<MailingWorker[]> {
    return this.mailingWorkerService.findAll(
      projectId,
      findAllMailingWorkersDto,
    );
  }
}
