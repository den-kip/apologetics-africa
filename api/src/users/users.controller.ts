import {
  Controller, Get, Patch, Post, Delete, Param, Body,
  Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, User } from './user.entity';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Self-service (any authenticated user) ──────────────────────────────────

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update own profile (name parts, username)' })
  updateMyProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change own password' })
  async changeMyPassword(
    @CurrentUser() user: User,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    await this.usersService.changePassword(user.id, body.currentPassword, body.newPassword);
  }

  @Post('me/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate own account (flagged inactive, not deleted)' })
  async deactivateMyAccount(@CurrentUser() user: User) {
    await this.usersService.deactivate(user.id);
  }

  // ── Admin-only ─────────────────────────────────────────────────────────────

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all users (admin only)' })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.usersService.findAll(+page, +limit);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user stats (admin only)' })
  getStats() {
    return this.usersService.getStats();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
