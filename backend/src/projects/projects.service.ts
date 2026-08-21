import {
    ConflictException,
    Injectable,
    NotFoundException,
    ForbiddenException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project } from './entities/project.entity';
import { QueryProjectDto } from './dto/query-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectMembersService } from '../project-members/project-members.service';
import { ProjectMemberRole } from '../project-members/entities/project-member.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project)
        private readonly projectsRepository: Repository<Project>,
        private readonly projectMembersService: ProjectMembersService,

        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly dataSource: DataSource,
        private readonly redisService: RedisService,
    ) { }

    async create(
        createProjectDto: CreateProjectDto,
        ownerId: string,
    ) {
        const owner = await this.usersRepository.findOne({
            where: {
                id: ownerId,
            },
        });

        if (!owner) {
            throw new NotFoundException(
                'Owner not found',
            );
        }

        const existingProject =
            await this.projectsRepository.findOne({
                where: {
                    slug: createProjectDto.slug,
                },
            });

        if (existingProject) {
            throw new ConflictException(
                'Project slug already exists',
            );
        }

        return this.dataSource.transaction(
            async (manager) => {

                const projectRepository =
                    manager.getRepository(Project);

                const project =
                    projectRepository.create({
                        name: createProjectDto.name,
                        slug: createProjectDto.slug,
                        description:
                            createProjectDto.description ?? null,
                        status: createProjectDto.status,
                        priority: createProjectDto.priority,
                        startDate:
                            createProjectDto.startDate ?? null,
                        dueDate:
                            createProjectDto.dueDate ?? null,
                        ownerId: owner.id,
                    });

                const savedProject =
                    await projectRepository.save(project);

                await this.projectMembersService.create(
                    savedProject.id,
                    {
                        userId: owner.id,
                    },
                    ProjectMemberRole.MANAGER,
                    manager,
                );

                await this.invalidateProjectCache();
                return savedProject;
            },
        );
    }

    async findAll(
        query: QueryProjectDto,
        userId: string,
    ) {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            priority,
            sortBy = 'created_at',
            sortOrder = 'DESC',
        } = query;

        const cacheKey = this.buildProjectsCacheKey(
            userId,
            query,
        );

        const cached = await this.redisService.get(cacheKey);

        if (cached) {
            return JSON.parse(cached);
        }

        const queryBuilder = this.projectsRepository
            .createQueryBuilder('project')
            .leftJoinAndSelect('project.owner', 'owner')
            .innerJoin(
                'project_members',
                'projectMember',
                'projectMember.project_id = project.id',
            )
            .andWhere(
                'projectMember.user_id = :userId',
                { userId },
            );

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

        const result = {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };

        await this.redisService.set(
            cacheKey,
            JSON.stringify(result),
            60,
        );

        return result;
    }

    async findOne(
        id: string,
        userId: string,
    ) {
        const project = await this.projectsRepository.findOne({
            where: { id },
            relations: {
                owner: true,
            },
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        const isMember =
            await this.projectMembersService.isMember(
                id,
                userId,
            );

        if (!isMember) {
            throw new ForbiddenException(
                'You do not have access to this project',
            );
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
        await this.invalidateProjectCache();
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
        await this.invalidateProjectCache();

        return {
            message: 'Project deleted successfully',
        };
    }

    private buildProjectsCacheKey(
        userId: string,
        query: QueryProjectDto,
    ): string {
        const {
            page = 1,
            limit = 10,
            search = '',
            status = '',
            priority = '',
            sortBy = 'createdAt',
            sortOrder = 'DESC',
        } = query;

        return [
            'projects',
            userId,
            page,
            limit,
            search,
            status,
            priority,
            sortBy,
            sortOrder,
        ].join(':');
    }

    private async invalidateProjectCache(): Promise<void> {
        await this.redisService.deleteByPattern(
            'projects:*',
        );
    }
}
