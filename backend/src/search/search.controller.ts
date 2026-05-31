import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @ApiOperation({ summary: 'Semantic search over patient activities' })
  @ApiQuery({ name: 'q', description: 'Natural language query in Spanish' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max results (default 10)' })
  @Get()
  search(@Query('q') q: string, @Query('limit') limit?: string) {
    return this.searchService.search(q, limit ? parseInt(limit, 10) : 10);
  }
}
