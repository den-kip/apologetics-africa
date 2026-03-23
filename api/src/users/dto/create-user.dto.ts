import { IsEmail, IsString, MinLength, IsOptional, IsEnum, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Grace' })
  @IsString()
  firstName: string;

  @ApiPropertyOptional({ example: 'Wanjiku' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ example: 'Mwangi' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({
    example: 'grace_mwangi',
    description: 'Optional unique username (3-30 chars, lowercase letters, numbers, underscores)',
  })
  @IsOptional()
  @Matches(/^[a-z0-9_]{3,30}$/, {
    message: 'Username must be 3-30 characters: lowercase letters, numbers, and underscores only',
  })
  username?: string;

  @ApiPropertyOptional({ example: 'Seeker123', description: 'Optional public display alias' })
  @IsOptional()
  @IsString()
  alias?: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.USER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
