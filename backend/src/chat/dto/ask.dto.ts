import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsString, Min, ValidateNested } from 'class-validator';

export class ChatMessageDto {
  @IsEnum(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  content: string;
}

export class AskDto {
  @IsString()
  query: string;

  @IsInt()
  @Min(1)
  patientCode: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history: ChatMessageDto[];
}
