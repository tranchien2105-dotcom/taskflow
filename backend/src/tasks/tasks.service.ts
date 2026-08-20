import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
    ) { }

    async create(createTaskDto: CreateTaskDto): Promise<Task> {
        const task = this.taskRepository.create(createTaskDto);

        return this.taskRepository.save(task);
    }

    async findAll(query: TaskQueryDto) {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            priority,
            projectId,
            assigneeId,
        } = query;

        const skip = (page - 1) * limit;

        const queryBuilder = this.taskRepository
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.project', 'project')
            .leftJoinAndSelect('task.creator', 'creator')
            .leftJoinAndSelect('task.assignee', 'assignee');

        if (search) {
            queryBuilder.andWhere(
                '(task.title ILIKE :search OR task.description ILIKE :search)',
                {
                    search: `%${search}%`,
                },
            );
        }

        if (status) {
            queryBuilder.andWhere(
                'task.status = :status',
                { status },
            );
        }

        if (priority) {
            queryBuilder.andWhere(
                'task.priority = :priority',
                { priority },
            );
        }

        if (projectId) {
            queryBuilder.andWhere(
                'task.projectId = :projectId',
                { projectId },
            );
        }

        if (assigneeId) {
            queryBuilder.andWhere(
                'task.assigneeId = :assigneeId',
                { assigneeId },
            );
        }

        const [data, total] = await queryBuilder
            .orderBy('task.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string): Promise<Task> {
        const task = await this.taskRepository.findOne({
            where: { id },
            relations: {
                project: true,
                creator: true,
                assignee: true,
            },
        });

        if (!task) {
            throw new NotFoundException('Task not found');
        }

        return task;
    }

    async update(
        id: string,
        updateTaskDto: UpdateTaskDto,
    ): Promise<Task> {
        const task = await this.findOne(id);

        Object.assign(task, updateTaskDto);

        return this.taskRepository.save(task);
    }

    async remove(id: string): Promise<void> {
        const task = await this.findOne(id);

        await this.taskRepository.remove(task);
    }
}