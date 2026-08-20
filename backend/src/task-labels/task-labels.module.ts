import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TaskLabel } from './entities/task-label.entity';
import { TaskLabelsService } from './task-labels.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaskLabel])],
  providers: [TaskLabelsService],
  exports: [TaskLabelsService],
})
export class TaskLabelsModule {}