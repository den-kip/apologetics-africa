import {
  Controller, Get, Post, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { BookmarksService } from './bookmarks.service';
import { BookmarkType } from './bookmark.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

class ToggleBookmarkDto {
  @IsEnum(BookmarkType)
  type: BookmarkType;

  @IsUUID()
  targetId: string;
}

@ApiTags('bookmarks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'bookmarks', version: '1' })
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post('toggle')
  @ApiOperation({ summary: 'Toggle a bookmark on/off' })
  toggle(@Body() dto: ToggleBookmarkDto, @CurrentUser() user: User) {
    return this.bookmarksService.toggle(user.id, dto.type, dto.targetId);
  }

  @Get('check')
  @ApiOperation({ summary: 'Check if an item is bookmarked' })
  @ApiQuery({ name: 'type', enum: BookmarkType })
  @ApiQuery({ name: 'targetId' })
  check(
    @Query('type') type: BookmarkType,
    @Query('targetId') targetId: string,
    @CurrentUser() user: User,
  ) {
    return this.bookmarksService.isBookmarked(user.id, type, targetId);
  }

  @Get()
  @ApiOperation({ summary: 'List all bookmarks for the current user' })
  @ApiQuery({ name: 'type', enum: BookmarkType, required: false })
  findAll(
    @CurrentUser() user: User,
    @Query('type') type?: BookmarkType,
  ) {
    return this.bookmarksService.findByUser(user.id, type);
  }
}
