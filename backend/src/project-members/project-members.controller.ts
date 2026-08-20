import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';

import { ProjectMembersService } from './project-members.service';
import { ProjectAccessGuard } from '../project-access/project-access.guard';
import { CreateProjectMemberDto } from '../project-members/dto/create-project-member.dto';
import { UpdateProjectMemberDto } from '../project-members/dto//update-project-member.dto';
import { ProjectManagerGuard } from '../project-manager/project-manager.guard';


@Controller('projects/:projectId/members')
export class ProjectMembersController {
    constructor(
        private readonly projectMembersService: ProjectMembersService,
    ) { }

    @Post()
    @UseGuards(ProjectManagerGuard)
    create(
        @Param('projectId') projectId: string,
        @Body() createDto: CreateProjectMemberDto,
    ) {
        return this.projectMembersService.create(
            projectId,
            createDto,
        );
    }

    @Get()
    @UseGuards(ProjectAccessGuard)
    findAll(
        @Param('projectId') projectId: string,
    ) {
        return this.projectMembersService.findAll(
            projectId,
        );
    }

    @Get(':userId')
    @UseGuards(ProjectAccessGuard)
    findOne(
        @Param('projectId') projectId: string,
        @Param('userId') userId: string,
    ) {
        return this.projectMembersService.findOne(
            projectId,
            userId,
        );
    }

    @Patch(':userId')
    @UseGuards(ProjectAccessGuard)
    update(
        @Param('projectId') projectId: string,
        @Param('userId') userId: string,
        @Body() updateDto: UpdateProjectMemberDto,
    ) {
        return this.projectMembersService.update(
            projectId,
            userId,
            updateDto,
        );
    }

    @Delete(':userId')
    @UseGuards(ProjectAccessGuard)
    remove(
        @Param('projectId') projectId: string,
        @Param('userId') userId: string,
    ) {
        return this.projectMembersService.remove(
            projectId,
            userId,
        );
    }
}