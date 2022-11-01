import {
  Controller,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { Auth } from '../auth/auth.decorator';
import { BearerAuthGuard } from '../auth/bearer-auth.guard';
import { TokenPayload } from '../auth/entities/token-payload.entity';
import { PlainToClassInterceptor } from '../shared/interceptors/plain-to-class.interceptor';
import { CreateMailingDto } from './dto/create-mailing.dto';
import { UpdateMailingDto } from './dto/update-mailing.dto';
import { MailingWorker } from './entities/mailing-worker.entity';
import { Mailing } from './entities/mailing.entity';
import { MailingWorkerService } from './mailing-worker.service';
import { MailingService } from './mailing.service';

@Controller()
export class MailingController {
  constructor(
    private readonly mailingService: MailingService,
    private readonly mailingWorkerService: MailingWorkerService,
  ) {}

  @MessagePattern('mailings.initialize')
  @UseGuards(BearerAuthGuard)
  initializeForProject(
    @Auth() auth: TokenPayload,
    @Ctx() context: RmqContext,
  ): Promise<Record<string, never>> {
    return this.mailingService.initialize(
      auth.project.id,
      context.getMessage().properties.headers.authorization.substring(7),
    );
  }

  @MessagePattern('mailings.create')
  @UseGuards(BearerAuthGuard)
  @UseInterceptors(new PlainToClassInterceptor(Mailing))
  create(
    @Auth() auth: TokenPayload,
    @Payload('payload') createMailingDto: CreateMailingDto,
  ): Promise<Mailing> {
    return this.mailingService.create(auth.project.id, createMailingDto);
  }

  @MessagePattern('mailings.findAll')
  @UseGuards(BearerAuthGuard)
  @UseInterceptors(new PlainToClassInterceptor(Mailing))
  findAll(@Auth() auth: TokenPayload): Promise<Mailing[]> {
    return this.mailingService.findAll(auth.project.id);
  }

  @MessagePattern('mailings.findOne')
  @UseGuards(BearerAuthGuard)
  @UseInterceptors(new PlainToClassInterceptor(Mailing))
  findOne(
    @Auth() auth: TokenPayload,
    @Payload('payload', ParseIntPipe) id: number,
  ): Promise<Mailing> {
    return this.mailingService.findOne(auth.project.id, id);
  }

  @MessagePattern('mailings.update')
  @UseGuards(BearerAuthGuard)
  @UseInterceptors(new PlainToClassInterceptor(Mailing))
  update(
    @Auth() auth: TokenPayload,
    @Payload('payload') updateMailingDto: UpdateMailingDto,
  ): Promise<Mailing> {
    return this.mailingService.update(auth.project.id, updateMailingDto);
  }

  @MessagePattern('mailings.remove')
  @UseGuards(BearerAuthGuard)
  @UseInterceptors(new PlainToClassInterceptor(Mailing))
  remove(
    @Auth() auth: TokenPayload,
    @Payload('payload', ParseIntPipe) id: number,
  ): Promise<Mailing> {
    return this.mailingService.remove(auth.project.id, id);
  }

  @MessagePattern('mailings.findAllWorkers')
  @UseGuards(BearerAuthGuard)
  @UseInterceptors(new PlainToClassInterceptor(MailingWorker))
  findAllWorkers(
    @Auth() auth: TokenPayload,
    @Payload('payload', ParseIntPipe) mailingId: number,
  ): Promise<MailingWorker[]> {
    return this.mailingWorkerService.findAll(auth.project.id, mailingId);
  }
}
