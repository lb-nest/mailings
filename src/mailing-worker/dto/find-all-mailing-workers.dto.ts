import { IsInt, IsOptional } from 'class-validator';

export class FindAllMailingWorkersDto {
  @IsInt()
  mailingId: number;

  @IsOptional()
  @IsInt()
  skip?: number;

  @IsInt()
  @IsOptional()
  take?: number;
}
