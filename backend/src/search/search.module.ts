import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [ActivitiesModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
