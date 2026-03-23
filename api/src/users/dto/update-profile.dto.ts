import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Grace' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Wanjiku' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional({ example: 'Mwangi' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    example: 'grace_mwangi',
    description: 'Unique username (3-30 chars, lowercase letters, numbers, underscores)',
  })
  @IsOptional()
  @Matches(/^[a-z0-9_]{3,30}$/, {
    message: 'Username must be 3-30 characters: lowercase letters, numbers, and underscores only',
  })
  username?: string;
}
