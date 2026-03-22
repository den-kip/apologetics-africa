import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveSession, SessionStatus } from './live-session.entity';
import { ChatMessage } from './chat-message.entity';
import { ChatReaction } from './chat-reaction.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(LiveSession)
    private sessionRepo: Repository<LiveSession>,
    @InjectRepository(ChatMessage)
    private messageRepo: Repository<ChatMessage>,
    @InjectRepository(ChatReaction)
    private reactionRepo: Repository<ChatReaction>,
  ) {}

  // ─── Sessions ─────────────────────────────────────────────────────────────

  async listSessions(status?: SessionStatus, includeEnded = false) {
    const qb = this.sessionRepo.createQueryBuilder('s')
      .orderBy('s.scheduledAt', 'DESC');

    if (status) {
      qb.where('s.status = :status', { status });
    } else if (!includeEnded) {
      qb.where('s.status != :ended', { ended: SessionStatus.ENDED });
    }

    return qb.getMany();
  }

  async getLiveSession(): Promise<LiveSession | null> {
    return this.sessionRepo.findOne({ where: { status: SessionStatus.LIVE } });
  }

  async getSessionById(id: string, isAdmin = false): Promise<LiveSession> {
    const session = await this.sessionRepo.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    if (!isAdmin && session.status === SessionStatus.ENDED) {
      throw new ForbiddenException('Session has ended');
    }
    return session;
  }

  async createSession(
    title: string,
    description?: string,
    scheduledAt?: Date,
  ): Promise<LiveSession> {
    const session = this.sessionRepo.create({ title, description, scheduledAt });
    return this.sessionRepo.save(session);
  }

  async updateSession(id: string, data: { title?: string; description?: string; scheduledAt?: string }): Promise<LiveSession> {
    const session = await this.sessionRepo.findOneOrFail({ where: { id } });
    if (data.title !== undefined) session.title = data.title;
    if (data.description !== undefined) session.description = data.description;
    if (data.scheduledAt !== undefined) session.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    return this.sessionRepo.save(session);
  }

  async startSession(id: string): Promise<LiveSession> {
    const session = await this.sessionRepo.findOneOrFail({ where: { id } });
    session.status = SessionStatus.LIVE;
    session.startedAt = new Date();
    return this.sessionRepo.save(session);
  }

  async endSession(id: string): Promise<LiveSession> {
    const session = await this.sessionRepo.findOneOrFail({ where: { id } });
    session.status = SessionStatus.ENDED;
    session.endedAt = new Date();
    return this.sessionRepo.save(session);
  }

  async removeSession(id: string): Promise<void> {
    await this.sessionRepo.delete(id);
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.messageRepo.find({
      where: { sessionId, deleted: false },
      relations: ['reactions', 'replyTo'],
      order: { createdAt: 'ASC' },
    });
  }

  async sendMessage(
    sessionId: string,
    userId: string,
    authorName: string,
    body: string,
    replyToId?: string,
  ): Promise<ChatMessage> {
    const msg = this.messageRepo.create({
      sessionId,
      userId,
      authorName,
      body,
      replyToId: replyToId || null,
    });
    const saved = await this.messageRepo.save(msg);
    return this.messageRepo.findOne({
      where: { id: saved.id },
      relations: ['reactions', 'replyTo'],
    });
  }

  async toggleReaction(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<{ added: boolean; messageId: string; emoji: string; count: number; userIds: string[] }> {
    const existing = await this.reactionRepo.findOne({ where: { messageId, userId, emoji } });
    if (existing) {
      await this.reactionRepo.remove(existing);
    } else {
      await this.reactionRepo.save(this.reactionRepo.create({ messageId, userId, emoji }));
    }
    const reactions = await this.reactionRepo.find({ where: { messageId, emoji } });
    return {
      added: !existing,
      messageId,
      emoji,
      count: reactions.length,
      userIds: reactions.map((r) => r.userId),
    };
  }

  async pinMessage(messageId: string, pinned: boolean): Promise<void> {
    await this.messageRepo.update(messageId, { pinned });
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.messageRepo.update(messageId, { deleted: true });
  }

  // ─── Serialization ────────────────────────────────────────────────────────

  serializeMessage(msg: ChatMessage) {
    const reactions: Record<string, { count: number; userIds: string[] }> = {};
    if (msg.reactions) {
      for (const r of msg.reactions) {
        if (!reactions[r.emoji]) reactions[r.emoji] = { count: 0, userIds: [] };
        reactions[r.emoji].count++;
        reactions[r.emoji].userIds.push(r.userId);
      }
    }
    return {
      id: msg.id,
      sessionId: msg.sessionId,
      authorName: msg.authorName,
      userId: msg.userId,
      body: msg.body,
      pinned: msg.pinned,
      replyToId: msg.replyToId,
      replyTo: msg.replyTo
        ? { id: msg.replyTo.id, authorName: msg.replyTo.authorName, body: msg.replyTo.body }
        : null,
      reactions,
      createdAt: msg.createdAt,
    };
  }
}
