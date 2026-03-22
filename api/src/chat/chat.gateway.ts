import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ChatService } from './chat.service';
import { UserRole } from '../users/user.entity';
import { SessionStatus } from './live-session.entity';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  // Run auth as namespace middleware so user is attached BEFORE any event fires
  afterInit(server: Server) {
    server.use(async (socket: Socket, next) => {
      try {
        const token =
          (socket.handshake.auth?.token as string) ||
          (socket.handshake.query?.token as string);
        if (!token) return next(new Error('Unauthorized'));

        const payload = this.jwtService.verify(token, {
          secret: this.configService.get('JWT_SECRET'),
        });
        const user = await this.usersService.findOne(payload.sub);
        if (!user) return next(new Error('Unauthorized'));

        socket.data.user = user;
        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    });
  }

  handleConnection(client: Socket) {
    if (client.data.user) {
      this.logger.log(`Connected: ${client.data.user.name} (${client.data.user.id})`);
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.user) {
      this.logger.log(`Disconnected: ${client.data.user.name}`);
    }
  }

  // ─── Join session room & get history ──────────────────────────────────────

  @SubscribeMessage('session:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() sessionId: string,
  ) {
    const user = client.data.user;
    if (!user) return { error: 'Not authenticated' };

    try {
      const isAdmin = [UserRole.ADMIN, UserRole.EDITOR].includes(user.role);
      const session = await this.chatService.getSessionById(sessionId, isAdmin);

      if (!isAdmin && session.status !== SessionStatus.LIVE) {
        return { error: 'Session is not live' };
      }

      await client.join(`session:${sessionId}`);

      const messages = await this.chatService.getMessages(sessionId);
      return {
        session: {
          id: session.id,
          title: session.title,
          description: session.description,
          status: session.status,
          startedAt: session.startedAt,
        },
        messages: messages.map((m) => this.chatService.serializeMessage(m)),
      };
    } catch (err) {
      return { error: err.message };
    }
  }

  // ─── Send message ──────────────────────────────────────────────────────────

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; body: string; replyToId?: string },
  ) {
    const user = client.data.user;
    if (!user) return { error: 'Not authenticated' };
    if (!data.body?.trim()) return { error: 'Message cannot be empty' };
    if (data.body.length > 1000) return { error: 'Message too long (max 1000 chars)' };

    try {
      const session = await this.chatService.getSessionById(data.sessionId);
      if (session.status !== SessionStatus.LIVE) {
        return { error: 'Session is not live' };
      }

      const msg = await this.chatService.sendMessage(
        data.sessionId,
        user.id,
        user.alias || user.name,
        data.body.trim(),
        data.replyToId,
      );

      this.server
        .to(`session:${data.sessionId}`)
        .emit('message:new', this.chatService.serializeMessage(msg));
      return { ok: true };
    } catch (err) {
      return { error: err.message };
    }
  }

  // ─── React to message ──────────────────────────────────────────────────────

  @SubscribeMessage('message:react')
  async handleReact(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; sessionId: string; emoji: string },
  ) {
    const user = client.data.user;
    if (!user) return { error: 'Not authenticated' };
    if (!data.emoji) return { error: 'Emoji is required' };

    try {
      const result = await this.chatService.toggleReaction(data.messageId, user.id, data.emoji);
      this.server.to(`session:${data.sessionId}`).emit('message:reaction', result);
      return { ok: true };
    } catch (err) {
      return { error: err.message };
    }
  }

  // ─── Pin message (admin/editor) ────────────────────────────────────────────

  @SubscribeMessage('message:pin')
  async handlePin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; sessionId: string; pinned: boolean },
  ) {
    const user = client.data.user;
    if (!user || ![UserRole.ADMIN, UserRole.EDITOR].includes(user.role)) {
      return { error: 'Not authorized' };
    }

    try {
      await this.chatService.pinMessage(data.messageId, data.pinned);
      this.server
        .to(`session:${data.sessionId}`)
        .emit('message:pinned', { messageId: data.messageId, pinned: data.pinned });
      return { ok: true };
    } catch (err) {
      return { error: err.message };
    }
  }

  // ─── Delete message (admin/editor) ────────────────────────────────────────

  @SubscribeMessage('message:delete')
  async handleDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; sessionId: string },
  ) {
    const user = client.data.user;
    if (!user || ![UserRole.ADMIN, UserRole.EDITOR].includes(user.role)) {
      return { error: 'Not authorized' };
    }

    try {
      await this.chatService.deleteMessage(data.messageId);
      this.server
        .to(`session:${data.sessionId}`)
        .emit('message:deleted', { messageId: data.messageId });
      return { ok: true };
    } catch (err) {
      return { error: err.message };
    }
  }

  // ─── Broadcast session state change ───────────────────────────────────────

  broadcastSessionUpdate(sessionId: string, status: string) {
    this.server.to(`session:${sessionId}`).emit('session:update', { sessionId, status });
  }
}
