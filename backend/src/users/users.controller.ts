import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UserRole } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'List users, optionally filtered by role' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @Get()
  findAll(@Query('role') role?: UserRole) {
    if (role) return this.usersService.findByRole(role);
    return [];
  }

  @ApiOperation({ summary: 'Create a user with any role (admin only)' })
  @Roles(UserRole.ADMIN)
  @Post()
  createUser(@Body() dto: CreateUserByAdminDto) {
    return this.usersService.createUser(dto);
  }

  @ApiOperation({ summary: 'List all users paginated (admin only)' })
  @Roles(UserRole.ADMIN)
  @Get('all')
  findUsers(@Query() pagination: PaginationQueryDto) {
    return this.usersService.findUsers(pagination);
  }

  @ApiOperation({ summary: 'Update any user including role (admin only)' })
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, dto);
  }

  @ApiOperation({ summary: 'Create a patient' })
  @Roles(UserRole.ADMIN)
  @Post('patients')
  createPatient(@Body() dto: CreatePatientDto) {
    return this.usersService.createPatient(dto);
  }

  @ApiOperation({ summary: 'List patients (paginated)' })
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Get('patients')
  findPatients(@Query() pagination: PaginationQueryDto) {
    return this.usersService.findPatients(pagination);
  }

  @ApiOperation({ summary: 'Get a patient by id' })
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Get('patients/:id')
  findPatientById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findPatientById(id);
  }

  @ApiOperation({ summary: 'Update a patient' })
  @Roles(UserRole.ADMIN)
  @Patch('patients/:id')
  updatePatient(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.usersService.updatePatient(id, dto);
  }

  @ApiOperation({ summary: 'Soft-delete a patient' })
  @Roles(UserRole.ADMIN)
  @Delete('patients/:id')
  @HttpCode(204)
  softDeletePatient(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.softDeletePatient(id);
  }
}
