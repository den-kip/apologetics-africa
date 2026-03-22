import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import slugify from 'slugify';
import { Question, QuestionCategory, QuestionStatus } from './question.entity';
import { QuestionComment } from './question-comment.entity';
import { CommentReaction } from './comment-reaction.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

const ALLOWED_EMOJIS = ['👍', '❤️', '🙏', '💡'];

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question) private repo: Repository<Question>,
    @InjectRepository(QuestionComment) private commentRepo: Repository<QuestionComment>,
    @InjectRepository(CommentReaction) private reactionRepo: Repository<CommentReaction>,
    @InjectQueue('mail') private mailQueue: Queue,
  ) {}

  async submit(dto: CreateQuestionDto): Promise<Question> {
    const question = this.repo.create(dto);
    const saved = await this.repo.save(question);

    // Queue confirmation email
    await this.mailQueue.add('question-received', {
      to: dto.askerEmail,
      name: dto.askerName,
      questionTitle: dto.title,
    });

    return saved;
  }

  async findAll(opts: {
    page?: number;
    limit?: number;
    status?: QuestionStatus;
    category?: QuestionCategory;
    search?: string;
    featured?: boolean;
    hidden?: boolean;
  }) {
    const { page = 1, limit = 12, status, category, search, featured, hidden } = opts;
    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (featured !== undefined) where.featured = featured;
    if (hidden !== undefined) where.hidden = hidden;
    if (search) where.title = ILike(`%${search}%`);

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { featured: 'DESC', answeredAt: 'DESC', createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findAnswered(opts: { page?: number; limit?: number; search?: string; category?: QuestionCategory }) {
    return this.findAll({ ...opts, status: QuestionStatus.ANSWERED, hidden: false });
  }

  async findByEmail(email: string, opts: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 20 } = opts;
    const [data, total] = await this.repo.findAndCount({
      where: { askerEmail: email },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Question> {
    const q = await this.repo.findOne({ where: { id }, relations: ['answeredBy'] });
    if (!q) throw new NotFoundException('Question not found');
    return q;
  }

  async findBySlug(slug: string): Promise<Question> {
    const q = await this.repo.findOne({ where: { slug }, relations: ['answeredBy'] });
    if (!q) throw new NotFoundException('Question not found');
    await this.repo.increment({ id: q.id }, 'viewCount', 1);
    return q;
  }

  async answer(id: string, dto: AnswerQuestionDto, answeredById: string): Promise<Question> {
    const q = await this.findOne(id);
    const slug = await this.generateSlug(q.title, id);
    q.answer = dto.answer;
    q.status = QuestionStatus.ANSWERED;
    q.answeredAt = new Date();
    q.answeredById = answeredById;
    q.slug = slug;
    if (dto.tags) q.tags = dto.tags;
    if (dto.featured !== undefined) q.featured = dto.featured;
    if (dto.category) q.category = dto.category;
    if (dto.topicId !== undefined) q.topicId = dto.topicId || null;
    const saved = await this.repo.save(q);

    // Notify asker
    await this.mailQueue.add('question-answered', {
      to: q.askerEmail,
      name: q.askerName,
      questionTitle: q.title,
      questionSlug: slug,
    });

    return saved;
  }

  async reject(id: string): Promise<Question> {
    const q = await this.findOne(id);
    q.status = QuestionStatus.REJECTED;
    return this.repo.save(q);
  }

  async lock(id: string, locked: boolean): Promise<Question> {
    const q = await this.findOne(id);
    q.locked = locked;
    return this.repo.save(q);
  }

  async toggleContributions(id: string, allow: boolean): Promise<Question> {
    const q = await this.findOne(id);
    q.allowContributions = allow;
    return this.repo.save(q);
  }

  async remove(id: string): Promise<void> {
    const q = await this.findOne(id);
    await this.repo.remove(q);
  }

  // ── Comments ───────────────────────────────────────────────────────────────

  async getComments(questionId: string, includeHidden = false) {
    const q = await this.findOne(questionId);
    const where: any = { questionId: q.id };
    if (!includeHidden) where.hidden = false;
    const comments = await this.commentRepo.find({
      where,
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });

    // Attach reaction counts to each comment
    const commentIds = comments.map((c) => c.id);
    if (commentIds.length === 0) return comments.map((c) => ({ ...c, reactions: [] }));

    const reactions = await this.reactionRepo
      .createQueryBuilder('r')
      .select(['r.commentId', 'r.emoji', 'r.userId'])
      .where('r.commentId IN (:...ids)', { ids: commentIds })
      .getMany();

    const reactionMap = new Map<string, { emoji: string; count: number; userIds: string[] }[]>();
    for (const r of reactions) {
      const list = reactionMap.get(r.commentId) ?? [];
      const existing = list.find((x) => x.emoji === r.emoji);
      if (existing) {
        existing.count++;
        existing.userIds.push(r.userId);
      } else {
        list.push({ emoji: r.emoji, count: 1, userIds: [r.userId] });
      }
      reactionMap.set(r.commentId, list);
    }

    return comments.map((c) => ({
      ...c,
      reactions: (reactionMap.get(c.id) ?? []).map(({ emoji, count, userIds }) => ({ emoji, count, userIds })),
    }));
  }

  async addComment(questionId: string, dto: CreateCommentDto, authorId: string) {
    const q = await this.findOne(questionId);
    if (q.locked) throw new ForbiddenException('This question is locked for comments');
    const comment = this.commentRepo.create({ body: dto.body, questionId: q.id, authorId });
    return this.commentRepo.save(comment);
  }

  async deleteComment(commentId: string): Promise<void> {
    const c = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!c) throw new NotFoundException('Comment not found');
    await this.commentRepo.remove(c);
  }

  async toggleReaction(commentId: string, userId: string, emoji: string): Promise<{ added: boolean }> {
    if (!ALLOWED_EMOJIS.includes(emoji)) throw new ForbiddenException('Invalid emoji');
    const existing = await this.reactionRepo.findOne({ where: { commentId, userId, emoji } });
    if (existing) {
      await this.reactionRepo.remove(existing);
      return { added: false };
    }
    await this.reactionRepo.save(this.reactionRepo.create({ commentId, userId, emoji }));
    return { added: true };
  }

  async hideQuestion(id: string, hidden: boolean): Promise<Question> {
    const q = await this.findOne(id);
    q.hidden = hidden;
    return this.repo.save(q);
  }

  async hideComment(commentId: string, hidden: boolean): Promise<QuestionComment> {
    const c = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!c) throw new NotFoundException('Comment not found');
    c.hidden = hidden;
    return this.commentRepo.save(c);
  }

  async getStats() {
    const total = await this.repo.count();
    const pending = await this.repo.count({ where: { status: QuestionStatus.PENDING } });
    const answered = await this.repo.count({ where: { status: QuestionStatus.ANSWERED } });
    return { total, pending, answered };
  }

  private async generateSlug(title: string, excludeId?: string): Promise<string> {
    let slug = slugify(title, { lower: true, strict: true });
    let count = 0;
    while (true) {
      const candidate = count === 0 ? slug : `${slug}-${count}`;
      const existing = await this.repo.findOne({ where: { slug: candidate } });
      if (!existing || existing.id === excludeId) return candidate;
      count++;
    }
  }
}
