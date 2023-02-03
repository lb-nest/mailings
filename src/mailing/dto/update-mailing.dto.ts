import { PartialType } from '@nestjs/mapped-types';
import { IsInt } from 'class-validator';
import { CreateMailingDto } from './create-mailing.dto';

export class UpdateMailingDto extends PartialType(CreateMailingDto) {
  @IsInt()
  id: number;
}
