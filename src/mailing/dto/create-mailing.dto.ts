import { MailingStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsHexColor,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMailingDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  name: string;

  @Transform(({ value }) => value?.trim())
  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsHexColor()
  color: string;

  @IsInt()
  channelId: number;

  @IsInt({ each: true })
  tagIds: number[];

  @IsInt({ each: true })
  hsmIds: number[];

  @IsIn([MailingStatus.Disabled, MailingStatus.Scheduled])
  status?: MailingStatus;

  @Transform(({ value }) => new Date(value))
  @IsOptional()
  @IsDate()
  scheduledAt?: Date;
}
