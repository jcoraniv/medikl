import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { ChatService } from './chat.service';
import { AskDto } from './dto/ask.dto';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
@Roles(UserRole.ADMIN, UserRole.DOCTOR)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiOperation({ summary: 'Ask a question about a patient clinical history' })
  @Post('ask')
  async ask(
    @Body() dto: AskDto,
    @CurrentUser() currentUser: User,
  ): Promise<{ answer: string }> {
    const answer = await this.chatService.ask(dto, currentUser);
    return { answer };
  }
}
