import { Controller, ParseIntPipe, SerializeOptions } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateMailingDto } from './dto/create-mailing.dto';
import { UpdateMailingDto } from './dto/update-mailing.dto';
import { Mailing } from './entities/mailing.entity';
import { MailingService } from './mailing.service';

@SerializeOptions({
  type: Mailing,
})
@Controller()
export class MailingController {
  constructor(private readonly mailingService: MailingService) {}

  @MessagePattern('createMailing')
  create(
    @Payload('projectId', ParseIntPipe) projectId: number,
    @Payload() createMailingDto: CreateMailingDto,
  ): Promise<Mailing> {
    return this.mailingService.create(projectId, createMailingDto);
  }

  @MessagePattern('findAllMailings')
  findAll(
    @Payload('projectId', ParseIntPipe) projectId: number,
  ): Promise<Mailing[]> {
    return this.mailingService.findAll(projectId);
  }

  @MessagePattern('findOneMailing')
  findOne(
    @Payload('projectId', ParseIntPipe) projectId: number,
    @Payload('id', ParseIntPipe) id: number,
  ): Promise<Mailing> {
    return this.mailingService.findOne(projectId, id);
  }

  @MessagePattern('updateMailing')
  update(
    @Payload('projectId', ParseIntPipe) projectId: number,
    @Payload() updateMailingDto: UpdateMailingDto,
  ): Promise<Mailing> {
    return this.mailingService.update(projectId, updateMailingDto);
  }

  @MessagePattern('removeMailing')
  remove(
    @Payload('projectId', ParseIntPipe) projectId: number,
    @Payload('id', ParseIntPipe) id: number,
  ): Promise<Mailing> {
    return this.mailingService.remove(projectId, id);
  }
}
