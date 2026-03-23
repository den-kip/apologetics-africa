import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, User } from '../users/user.entity';
import { QuestionCategory, QuestionStatus } from './question.entity';

@ApiTags('questions')
@Controller({ path: 'questions', version: '1' })
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new question' })
  submit(@Body() dto: CreateQuestionDto) {
    return this.questionsService.submit(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List answered questions (public)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', enum: QuestionCategory, required: false })
  findAnswered(
    @Query('page') page = 1,
    @Query('limit') limit = 12,
    @Query('search') search?: string,
    @Query('category') category?: QuestionCategory,
  ) {
    return this.questionsService.findAnswered({ page: +page, limit: +limit, search, category });
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get questions submitted by the current user' })
  findMine(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.questionsService.findByEmail(user.email, { page: +page, limit: +limit });
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get question stats (admin)' })
  getStats() {
    return this.questionsService.getStats();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all questions (admin)' })
  @ApiQuery({ name: 'status', enum: QuestionStatus, required: false })
  @ApiQuery({ name: 'category', enum: QuestionCategory, required: false })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: QuestionStatus,
    @Query('category') category?: QuestionCategory,
    @Query('search') search?: string,
  ) {
    return this.questionsService.findAll({ page: +page, limit: +limit, status, category, search });
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get any question by ID (admin)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionsService.findOne(id);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get answered question by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.questionsService.findBySlug(slug);
  }

  @Patch(':id/answer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Answer a question (admin/editor)' })
  answer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AnswerQuestionDto,
    @CurrentUser() user: User,
  ) {
    return this.questionsService.answer(id, dto, user.id);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  reject(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionsService.reject(id);
  }

  @Patch(':id/lock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lock / unlock a question (admin/editor)' })
  lock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('locked') locked: boolean,
  ) {
    return this.questionsService.lock(id, locked);
  }

  @Patch(':id/contributions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle community contributions on a question (admin)' })
  toggleContributions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('allow') allow: boolean,
  ) {
    return this.questionsService.toggleContributions(id, allow);
  }

  @Patch(':id/hide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hide / unhide a question (admin/editor)' })
  hideQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('hidden') hidden: boolean,
  ) {
    return this.questionsService.hideQuestion(id, hidden);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionsService.remove(id);
  }

  // ── Comments ───────────────────────────────────────────────────────────────

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments for a question (public)' })
  getComments(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionsService.getComments(id, false);
  }

  @Get(':id/comments/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all comments including hidden (admin)' })
  getCommentsAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionsService.getComments(id, true);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment to a question (auth required)' })
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.questionsService.addComment(id, dto, user.id);
  }

  @Delete(':questionId/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment (admin)' })
  deleteComment(@Param('commentId', ParseUUIDPipe) commentId: string) {
    return this.questionsService.deleteComment(commentId);
  }

  @Patch(':questionId/comments/:commentId/hide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hide / unhide a comment (admin/editor)' })
  hideComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body('hidden') hidden: boolean,
  ) {
    return this.questionsService.hideComment(commentId, hidden);
  }

  @Post(':questionId/comments/:commentId/reactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle a reaction on a comment (auth required)' })
  toggleReaction(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body('emoji') emoji: string,
    @CurrentUser() user: User,
  ) {
    return this.questionsService.toggleReaction(commentId, user.id, emoji);
  }
}
