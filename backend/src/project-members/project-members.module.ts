import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectMember } from './entities/project-member.entity';
import { ProjectMembersService } from './project-members.service';
import { ProjectMembersController } from './project-members.controller';
import { ProjectAccessGuard } from '../project-access/project-access.guard';
import { ProjectManagerGuard } from '../project-manager/project-manager.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectMember]),
  ],

  controllers: [
    ProjectMembersController,
  ],

  providers: [
    ProjectMembersService,
    ProjectAccessGuard,
    ProjectManagerGuard,
  ],

  exports: [
    ProjectMembersService,
  ],
})
export class ProjectMembersModule { }