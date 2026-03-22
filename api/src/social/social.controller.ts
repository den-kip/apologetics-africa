import {
  Controller, Get, Post, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('social')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({ path: 'social', version: '1' })
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get social post log (admin)' })
  getLogs(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.socialService.getLogs(+page, +limit);
  }

  @Post('test/:platform')
  @ApiOperation({ summary: 'Test social media connection (admin)' })
  test(@Param('platform') platform: 'facebook' | 'twitter' | 'linkedin') {
    return this.socialService.testPlatform(platform);
  }
}
