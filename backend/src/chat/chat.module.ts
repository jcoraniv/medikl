import { Module } from '@nestjs/common';
import { ClinicalHistoryModule } from '../clinical-history/clinical-history.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [ClinicalHistoryModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
