import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from './entities/appointment.entity';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @ApiOperation({ summary: 'Create a new appointment' })
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Post()
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() currentUser: User) {
    return this.appointmentsService.create(dto, currentUser);
  }

  @ApiOperation({ summary: 'List appointments with optional filters (paginated)' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'doctorId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus })
  @Get()
  findAll(
    @CurrentUser() currentUser: User,
    @Query() pagination: PaginationQueryDto,
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('status') status?: AppointmentStatus,
  ) {
    return this.appointmentsService.findAll(currentUser, pagination, patientId, doctorId, status);
  }

  @ApiOperation({ summary: 'Get appointment by id' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() currentUser: User) {
    return this.appointmentsService.findOne(id, currentUser);
  }

  @ApiOperation({ summary: 'Update appointment details' })
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.appointmentsService.update(id, dto, currentUser);
  }

  @ApiOperation({ summary: 'Cancel an appointment' })
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Patch(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() currentUser: User) {
    return this.appointmentsService.cancel(id, currentUser);
  }

  @ApiOperation({ summary: 'Mark appointment as completed' })
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Patch(':id/complete')
  complete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() currentUser: User) {
    return this.appointmentsService.complete(id, currentUser);
  }
}
