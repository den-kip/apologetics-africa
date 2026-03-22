import { IsString, MinLength, IsOptional, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { QuestionCategory } from '../question.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnswerQuestionDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  answer: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ enum: QuestionCategory })
  @IsOptional()
  @IsEnum(QuestionCategory)
  category?: QuestionCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topicId?: string;
}
