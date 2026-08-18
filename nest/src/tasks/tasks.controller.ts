import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
  ) { }

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  findById(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tasksService.findById(id);
  }

  @Post()
  create(
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(createTaskDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.tasksService.delete(id);

    return {
      message: 'Task deleted successfully',
    };
  }
}