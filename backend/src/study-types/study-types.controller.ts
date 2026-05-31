import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
}
