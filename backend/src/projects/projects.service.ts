import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project } from './entities/project.entity';
import { QueryProjectDto } from './dto/query-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectMembersService } from '../project-members/project-members.service';
import { ProjectMemberRole } from '../project-members/entities/project-member.entity';

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project)
        private readonly projectsRepository: Repository<Project>,
        private readonly projectMembersService: ProjectMembersService,

        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) { }

    async create(createProjectDto: CreateProjectDto) {
        const owner = await this.usersRepository.findOne({
            where: {
                id: createProjectDto.ownerId,
            },
        });

        if (!owner) {
            throw new NotFoundException('Owner not found');
        }

        const existingProject = await this.projectsRepository.findOne({
            where: {
                slug: createProjectDto.slug,
            },
        });

        if (existingProject) {
            throw new ConflictException(
                'Project slug already exists',
            );
        }

        const project = this.projectsRepository.create({
            name: createProjectDto.name,
            slug: createProjectDto.slug,
            description: createProjectDto.description ?? null,
            status: createProjectDto.status,
            priority: createProjectDto.priority,
            startDate: createProjectDto.startDate ?? null,
            dueDate: createProjectDto.dueDate ?? null,
            ownerId: owner.id,
        });

        const savedProject =
            await this.projectsRepository.save(project);

        await this.projectMembersService.create(
            savedProject.id,
            {
                userId: owner.id,
            },
            ProjectMemberRole.MANAGER,
        );

        return savedProject;
    }

    async findAll(query: QueryProjectDto) {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            priority,
            sortBy = 'created_at',
            sortOrder = 'DESC',
        } = query;

        const queryBuilder = this.projectsRepository
            .createQueryBuilder('project')
            .leftJoinAndSelect('project.owner', 'owner');

        if (search) {
            queryBuilder.andWhere(
                '(project.name ILIKE :search OR project.description ILIKE :search)',
                {
                    search: `%${search}%`,
                },
            );
        }

        if (status) {
            queryBuilder.andWhere('project.status = :status', {
                status,
            });
        }

        if (priority) {
            queryBuilder.andWhere('project.priority = :priority', {
                priority,
            });
        }

        const allowedSortFields = [
            'createdAt',
            'updatedAt',
            'name',
            'dueDate',
        ];

        const safeSortBy = allowedSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';

        const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

        queryBuilder.orderBy(
            `project.${safeSortBy}`,
            safeSortOrder,
        );

        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
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

    async findOne(id: string) {
        const project = await this.projectsRepository.findOne({
            where: { id },
            relations: {
                owner: true,
            },
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        return project;
    }

    async update(id: string, updateProjectDto: UpdateProjectDto) {
        const project = await this.projectsRepository.findOne({
            where: { id },
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        if (
            updateProjectDto.slug &&
            updateProjectDto.slug !== project.slug
        ) {
            const existingProject = await this.projectsRepository.findOne({
                where: {
                    slug: updateProjectDto.slug,
                },
            });

            if (existingProject) {
                throw new ConflictException('Project slug already exists');
            }
        }

        Object.assign(project, updateProjectDto);

        return this.projectsRepository.save(project);
    }

    async remove(id: string) {
        const project = await this.projectsRepository.findOne({
            where: { id },
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        await this.projectsRepository.remove(project);

        return {
            message: 'Project deleted successfully',
        };
    }
}