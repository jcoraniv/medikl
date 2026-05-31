import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
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
}
