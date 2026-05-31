import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateStudyResultDto } from './dto/create-study-result.dto';
import { UpdateStudyResultDto } from './dto/update-study-result.dto';
import { StudyResultsService } from './study-results.service';

@ApiTags('study-results')
@ApiBearerAuth()
@Controller('study-results')
export class StudyResultsController {
  constructor(private readonly studyResultsService: StudyResultsService) {}

  @ApiOperation({ summary: 'Create a study result for an appointment' })
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Post()
  create(@Body() dto: CreateStudyResultDto, @CurrentUser() currentUser: User) {
    return this.studyResultsService.create(dto, currentUser);
  }

  @ApiOperation({ summary: 'List study results with optional filters (paginated)' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'doctorId', required: false })
  @ApiQuery({ name: 'appointmentId', required: false })
  @Get()
  findAll(
    @CurrentUser() currentUser: User,
    @Query() pagination: PaginationQueryDto,
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('appointmentId') appointmentId?: string,
  ) {
    return this.studyResultsService.findAll(currentUser, pagination, patientId, doctorId, appointmentId);
  }

  @ApiOperation({ summary: 'Get study results by appointment' })
  @Get('by-appointment/:appointmentId')
  findByAppointment(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.studyResultsService.findByAppointment(appointmentId, currentUser);
  }

  @ApiOperation({ summary: 'Get a study result by id' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() currentUser: User) {
    return this.studyResultsService.findOne(id, currentUser);
  }

  @ApiOperation({ summary: 'Update findings or conclusion' })
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudyResultDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.studyResultsService.update(id, dto, currentUser);
  }
}
