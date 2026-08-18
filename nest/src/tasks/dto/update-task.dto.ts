import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsIn(['TODO', 'DONE', 'IN_PROGRESS'])
  status?: 'TODO' | 'DONE' | 'IN_PROGRESS';

  @IsOptional()
  @IsInt()
  assigneeId?: number;
}