import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateStudyTypeDto } from './dto/create-study-type.dto';
import { UpdateStudyTypeDto } from './dto/update-study-type.dto';
import { StudyTypesService } from './study-types.service';

@ApiTags('study-types')
@ApiBearerAuth()
@Controller('study-types')
export class StudyTypesController {
  constructor(private readonly studyTypesService: StudyTypesService) {}

  @ApiOperation({ summary: 'List all study types' })
  @Get()
  findAll() {
    return this.studyTypesService.findAll();
  }

  @ApiOperation({ summary: 'Get study type by id' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.studyTypesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a study type' })
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Post()
  create(@Body() dto: CreateStudyTypeDto, @CurrentUser() currentUser: User) {
    return this.studyTypesService.create(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update a study type' })
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStudyTypeDto) {
    return this.studyTypesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Soft-delete a study type' })
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() currentUser: User) {
    return this.studyTypesService.remove(id, currentUser);
  }
}
