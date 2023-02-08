import { Controller, ParseIntPipe } from '@nestjs/common';
import { SerializeOptions } from '@nestjs/common/serializer';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FindAllMailingWorkersDto } from './dto/find-all-mailing-workers.dto';
import { MailingWorker } from './entities/mailing-worker.entity';
import { MailingWorkerService } from './mailing-worker.service';

@SerializeOptions({
  type: MailingWorker,
})
@Controller()
export class MailingWorkerController {
  constructor(private readonly mailingWorkerService: MailingWorkerService) {}

  @MessagePattern('findAllMailingWorkers')
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
