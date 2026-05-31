import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
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
  create(@Body() dto: CreateStudyResultDto) {
    return this.studyResultsService.create(dto);
  }

  @ApiOperation({ summary: 'List study results with optional filters' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'doctorId', required: false })
  @ApiQuery({ name: 'appointmentId', required: false })
  @Get()
  findAll(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('appointmentId') appointmentId?: string,
  ) {
    return this.studyResultsService.findAll(patientId, doctorId, appointmentId);
  }

  @ApiOperation({ summary: 'Get study results by appointment' })
  @Get('by-appointment/:appointmentId')
  findByAppointment(@Param('appointmentId', ParseUUIDPipe) appointmentId: string) {
    return this.studyResultsService.findByAppointment(appointmentId);
  }

  @ApiOperation({ summary: 'Get a study result by id' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.studyResultsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update findings or conclusion' })
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStudyResultDto) {
    return this.studyResultsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Mark result as reviewed' })
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Patch(':id/review')
  review(@Param('id', ParseUUIDPipe) id: string) {
    return this.studyResultsService.review(id);
  }
}
