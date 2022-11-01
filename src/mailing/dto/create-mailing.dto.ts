import { Transform } from 'class-transformer';
import {
  IsDate,
  IsHexColor,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMailingDto {
  @Transform(({ value }) => value.trim())
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsHexColor()
  color: string;

  @IsInt({ each: true })
  tagIds: number[];

  @IsInt({ each: true })
  hsmIds: number[];

  @IsOptional()
  @IsDate()
  scheduledAt?: Date;
}
