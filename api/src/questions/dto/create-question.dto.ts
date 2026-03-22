import { IsString, IsEmail, IsOptional, IsBoolean, IsArray, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionCategory } from '../question.entity';

export class CreateQuestionDto {
  @ApiProperty({ example: 'Does God exist? What is the best argument?' })
  @IsString()
  @MinLength(10)
  title: string;

  @ApiProperty({ example: 'I have been struggling with this question...' })
  @IsString()
  @MinLength(20)
  body: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  askerName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  askerEmail: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  anonymous?: boolean;

  @ApiPropertyOptional({ enum: QuestionCategory, default: QuestionCategory.GENERAL })
  @IsOptional()
  @IsEnum(QuestionCategory)
  category?: QuestionCategory;

  @ApiPropertyOptional({ description: 'ID of related topic or theme' })
  @IsOptional()
  @IsString()
  topicId?: string;
}
