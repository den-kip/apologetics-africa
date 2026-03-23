import { Injectable, NotFoundException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LiveSession, SessionStatus } from './live-session.entity';
import { ChatMessage } from './chat-message.entity';
import { ChatReaction } from './chat-reaction.entity';

// Returns the 2nd and 4th Saturday of a given month
function getSessionSaturdays(year: number, month: number): Date[] {
  const saturdays: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
  while (d.getMonth() === month) {
    saturdays.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  // 2nd Saturday = index 1, 4th Saturday = index 3
  return [saturdays[1], saturdays[3]].filter(Boolean);
}

@Injectable()
export class ChatService implements OnModuleInit {
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
      qb.where('s.status NOT IN (:...exclude)', {
        exclude: [SessionStatus.ENDED, SessionStatus.CANCELLED],
      });
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
    posterUrl?: string,
    link?: string,
  ): Promise<LiveSession> {
    const session = this.sessionRepo.create({ title, description, scheduledAt, posterUrl: posterUrl ?? null, link: link ?? null });
    return this.sessionRepo.save(session);
  }

  async updateSession(id: string, data: { title?: string; description?: string; scheduledAt?: string; posterUrl?: string; link?: string }): Promise<LiveSession> {
    const session = await this.sessionRepo.findOneOrFail({ where: { id } });
    if (data.title !== undefined) session.title = data.title;
    if (data.description !== undefined) session.description = data.description;
    if (data.scheduledAt !== undefined) session.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    if (data.posterUrl !== undefined) session.posterUrl = data.posterUrl || null;
    if (data.link !== undefined) session.link = data.link || null;
    return this.sessionRepo.save(session);
  }

  async getNextSession(): Promise<LiveSession | null> {
    return this.sessionRepo
      .createQueryBuilder('s')
      .where('s.status = :status', { status: SessionStatus.SCHEDULED })
      .andWhere('s.scheduledAt > :now', { now: new Date() })
      .orderBy('s.scheduledAt', 'ASC')
      .getOne();
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

  async cancelSession(id: string): Promise<LiveSession> {
    const session = await this.sessionRepo.findOneOrFail({ where: { id } });
    session.status = SessionStatus.CANCELLED;
    return this.sessionRepo.save(session);
  }

  async generateUpcomingSessions(monthsAhead = 2): Promise<{ created: number }> {
    const now = new Date();
    let created = 0;

    for (let offset = 0; offset <= monthsAhead; offset++) {
      const year = now.getFullYear() + Math.floor((now.getMonth() + offset) / 12);
      const month = (now.getMonth() + offset) % 12;

      for (const saturday of getSessionSaturdays(year, month)) {
        // Skip Saturdays that have already passed
        if (saturday < now) continue;

        // Check if a session already exists on this date (any status)
        const dayStart = new Date(saturday);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(saturday);
        dayEnd.setHours(23, 59, 59, 999);

        const existing = await this.sessionRepo.findOne({
          where: { scheduledAt: Between(dayStart, dayEnd) },
        });

        if (!existing) {
          const label = saturday.toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
          });
          // Default session time: 10:00 AM
          saturday.setHours(10, 0, 0, 0);
          await this.sessionRepo.save(
            this.sessionRepo.create({ title: `Session — ${label}`, scheduledAt: saturday }),
          );
          created++;
        }
      }
    }

    return { created };
  }

  async onModuleInit() {
    await this.generateUpcomingSessions(2);
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
