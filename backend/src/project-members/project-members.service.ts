import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';

import {
    ProjectMember,
    ProjectMemberRole,
} from './entities/project-member.entity';

import { CreateProjectMemberDto } from './dto/create-project-member.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';

@Injectable()
export class ProjectMembersService {
    constructor(
        @InjectRepository(ProjectMember)
        private readonly projectMemberRepository: Repository<ProjectMember>,
    ) { }

    async create(
        projectId: string,
        createDto: CreateProjectMemberDto,
        role: ProjectMemberRole = ProjectMemberRole.MEMBER,
        manager?: EntityManager,
    ): Promise<ProjectMember> {

        const repository = manager
            ? manager.getRepository(ProjectMember)
            : this.projectMemberRepository;

        const existingMember =
            await repository.findOne({
                where: {
                    projectId,
                    userId: createDto.userId,
                },
            });

        if (existingMember) {
            throw new ConflictException(
                'User is already a member of this project',
            );
        }

        const member = repository.create({
            projectId,
            userId: createDto.userId,
            role,
        });

        return repository.save(member);
    }

    async findAll(
        projectId: string,
    ): Promise<ProjectMember[]> {
        return this.projectMemberRepository.find({
            where: {
                projectId,
            },
            relations: {
                user: true,
            },
            order: {
                joinedAt: 'ASC',
            },
        });
    }

    async findOne(
        projectId: string,
        userId: string,
    ): Promise<ProjectMember> {
        const member =
            await this.projectMemberRepository.findOne({
                where: {
                    projectId,
                    userId,
                },
                relations: {
                    user: true,
                    project: true,
                },
            });

        if (!member) {
            throw new NotFoundException(
                'Project member not found',
            );
        }

        return member;
    }

    async update(
        projectId: string,
        userId: string,
        updateDto: UpdateProjectMemberDto,
    ): Promise<ProjectMember> {
        const member = await this.findOne(
            projectId,
            userId,
        );

        if (member.role === ProjectMemberRole.MANAGER) {
            throw new ForbiddenException(
                'Cannot change the role of a project manager',
            );
        }

        member.role = updateDto.role;

        return this.projectMemberRepository.save(member);
    }

    async remove(
        projectId: string,
        userId: string,
    ): Promise<void> {
        const member = await this.findOne(
            projectId,
            userId,
        );

        if (member.role === ProjectMemberRole.MANAGER) {
            throw new ForbiddenException(
                'Cannot remove a project manager',
            );
        }

        await this.projectMemberRepository.remove(member);
    }

    async isMember(
        projectId: string,
        userId: string,
    ): Promise<boolean> {
        const member =
            await this.projectMemberRepository.findOne({
                where: {
                    projectId,
                    userId,
                },
            });

        return !!member;
    }

    async getRole(
        projectId: string,
        userId: string,
    ): Promise<ProjectMemberRole | null> {
        const member =
            await this.projectMemberRepository.findOne({
                where: {
                    projectId,
                    userId,
                },
            });

        return member?.role ?? null;
    }

    async isManager(
        projectId: string,
        userId: string,
    ): Promise<boolean> {
        const member =
            await this.projectMemberRepository.findOne({
                where: {
                    projectId,
                    userId,
                    role: ProjectMemberRole.MANAGER,
                },
            });

        return !!member;
    }
}