import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { SessionStatus } from './live-session.entity';

class CreateSessionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  posterUrl?: string;

  @IsOptional()
  @IsString()
  link?: string;
}

@ApiTags('sessions')
@Controller({ path: 'sessions', version: '1' })
export class SessionsController {
  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List upcoming and live sessions (public)' })
  list(@Query('status') status?: SessionStatus) {
    return this.chatService.listSessions(status);
  }

  @Get('live')
  @ApiOperation({ summary: 'Get current live session (public)' })
  getLive() {
    return this.chatService.getLiveSession();
  }

  @Get('next')
  @ApiOperation({ summary: 'Get next upcoming scheduled session (public)' })
  getNext() {
    return this.chatService.getNextSession();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all sessions including archived (admin)' })
  listAll(@Query('status') status?: SessionStatus) {
    return this.chatService.listSessions(status, true);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session by ID' })
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.chatService.getSessionById(id);
  }

  @Get(':id/messages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get archived messages for a session (admin)' })
  async getMessages(@Param('id', ParseUUIDPipe) id: string) {
    const messages = await this.chatService.getMessages(id);
    return messages.map((m) => this.chatService.serializeMessage(m));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a session (admin)' })
  create(@Body() dto: CreateSessionDto) {
    return this.chatService.createSession(
      dto.title,
      dto.description,
      dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      dto.posterUrl,
      dto.link,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update session details (admin)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateSessionDto) {
    return this.chatService.updateSession(id, dto);
  }

  @Patch(':id/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a session — opens the chat (admin)' })
  async start(@Param('id', ParseUUIDPipe) id: string) {
    const session = await this.chatService.startSession(id);
    this.chatGateway.broadcastSessionUpdate(id, 'live');
    return session;
  }

  @Patch(':id/end')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'End a session — archives the chat (admin)' })
  async end(@Param('id', ParseUUIDPipe) id: string) {
    const session = await this.chatService.endSession(id);
    this.chatGateway.broadcastSessionUpdate(id, 'ended');
    return session;
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a session (admin)' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.chatService.cancelSession(id);
  }

  @Patch(':id/uncancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Uncancel a cancelled session — restores it to scheduled (admin)' })
  uncancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.chatService.uncancelSession(id);
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate upcoming sessions for the next 2 months (admin)' })
  generate() {
    return this.chatService.generateUpcomingSessions(2);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a session (admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.chatService.removeSession(id);
  }
}
