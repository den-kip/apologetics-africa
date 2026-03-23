import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bookmark, BookmarkType } from './bookmark.entity';
import { BlogPost } from '../blog/post.entity';
import { Resource } from '../resources/resource.entity';
import { Question } from '../questions/question.entity';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark) private repo: Repository<Bookmark>,
    @InjectRepository(BlogPost) private blogRepo: Repository<BlogPost>,
    @InjectRepository(Resource) private resourceRepo: Repository<Resource>,
    @InjectRepository(Question) private questionRepo: Repository<Question>,
  ) {}

  async toggle(
    userId: string,
    type: BookmarkType,
    targetId: string,
  ): Promise<{ bookmarked: boolean }> {
    const existing = await this.repo.findOne({
      where: { userId, type, targetId },
    });

    if (existing) {
      await this.repo.remove(existing);
      return { bookmarked: false };
    }

    await this.repo.save(this.repo.create({ userId, type, targetId }));
    return { bookmarked: true };
  }

  async isBookmarked(
    userId: string,
    type: BookmarkType,
    targetId: string,
  ): Promise<{ bookmarked: boolean }> {
    const exists = await this.repo.exists({ where: { userId, type, targetId } });
    return { bookmarked: exists };
  }

  async findByUser(userId: string, type?: BookmarkType) {
    const where: Partial<Bookmark> = { userId };
    if (type) where.type = type;

    const bookmarks = await this.repo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    // Enrich each bookmark with its content
    const enriched = await Promise.all(
      bookmarks.map(async (b) => {
        let content: any = null;
        if (b.type === BookmarkType.BLOG) {
          content = await this.blogRepo.findOne({
            where: { id: b.targetId },
            relations: ['author'],
          });
        } else if (b.type === BookmarkType.RESOURCE) {
          content = await this.resourceRepo.findOne({
            where: { id: b.targetId },
            relations: ['author'],
          });
        } else if (b.type === BookmarkType.QUESTION) {
          content = await this.questionRepo.findOne({
            where: { id: b.targetId },
          });
        }

        if (!content) return null;
        return { id: b.id, type: b.type, createdAt: b.createdAt, content };
      }),
    );

    return enriched.filter(Boolean);
  }
}
