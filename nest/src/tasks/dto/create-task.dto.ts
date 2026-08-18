import { IsIn, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsIn(['TODO', 'DONE', 'IN_PROGRESS'])
  status!: 'TODO' | 'DONE' | 'IN_PROGRESS';

  @IsInt()
  assigneeId!: number;
}