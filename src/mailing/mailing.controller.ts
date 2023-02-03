import { Controller, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PlainToClassInterceptor } from '../shared/interceptors/plain-to-class.interceptor';
import { CreateMailingDto } from './dto/create-mailing.dto';
import { UpdateMailingDto } from './dto/update-mailing.dto';
import { Mailing } from './entities/mailing.entity';
import { MailingService } from './mailing.service';

@Controller()
export class MailingController {
  constructor(private readonly mailingService: MailingService) {}

  @MessagePattern('createMailing')
  @UseInterceptors(new PlainToClassInterceptor(Mailing))
  create(
    @Payload('projectId', ParseIntPipe) projectId: number,
    @Payload() createMailingDto: CreateMailingDto,
  ): Promise<Mailing> {
    return this.mailingService.create(projectId, createMailingDto);
  }

  @MessagePattern('findAllMailings')
  @UseInterceptors(new PlainToClassInterceptor(Mailing))
  findAll(
    @Payload('projectId', ParseIntPipe) projectId: number,
  ): Promise<Mailing[]> {
    return this.mailingService.findAll(projectId);
  }

  @MessagePattern('findOneMailing')
  @UseInterceptors(new PlainToClassInterceptor(Mailing))
  findOne(
    @Payload('projectId', ParseIntPipe) projectId: number,
    @Payload('id', ParseIntPipe) id: number,
  ): Promise<Mailing> {
    return this.mailingService.findOne(projectId, id);
  }

  @MessagePattern('updateMailing')
  @UseInterceptors(new PlainToClassInterceptor(Mailing))
  update(
    @Payload('projectId', ParseIntPipe) projectId: number,
    @Payload() updateMailingDto: UpdateMailingDto,
  ): Promise<Mailing> {
    return this.mailingService.update(projectId, updateMailingDto);
  }

  @MessagePattern('removeMailing')
  @UseInterceptors(new PlainToClassInterceptor(Mailing))
  remove(
    @Payload('projectId', ParseIntPipe) projectId: number,
    @Payload('id', ParseIntPipe) id: number,
  ): Promise<Mailing> {
    return this.mailingService.remove(projectId, id);
  }
}
