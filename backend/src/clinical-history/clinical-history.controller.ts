import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ClinicalHistory, ClinicalHistoryService } from './clinical-history.service';

@Controller('clinical-history')
@Roles(UserRole.ADMIN, UserRole.DOCTOR)
export class ClinicalHistoryController {
  constructor(private readonly service: ClinicalHistoryService) {}

  @Get(':code')
  findByPatientCode(@Param('code', ParseIntPipe) code: number): Promise<ClinicalHistory> {
    return this.service.findByPatientCode(code);
  }
}
