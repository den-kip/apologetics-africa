import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TopicType } from '../topic.entity';

export class CreateTopicDto {
  @ApiProperty({ example: 'Existence of God' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ enum: TopicType, default: TopicType.TOPIC })
  @IsOptional()
  @IsEnum(TopicType)
  type?: TopicType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
