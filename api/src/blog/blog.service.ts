import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import slugify from 'slugify';
import { BlogPost } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SocialService } from '../social/social.service';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost) private repo: Repository<BlogPost>,
    private readonly socialService: SocialService,
  ) {}

  async create(dto: CreatePostDto, authorId?: string): Promise<BlogPost> {
    const slug = await this.generateSlug(dto.title);
    const readingTimeMinutes = this.estimateReadingTime(dto.content);
    const post = this.repo.create({
      ...dto,
      slug,
      readingTimeMinutes,
      authorId,
      publishedAt: dto.published ? new Date() : null,
    });
    const saved = await this.repo.save(post);
    if (dto.published) {
      this.socialService.postContent({
        id: saved.id, title: saved.title, excerpt: saved.excerpt,
        slug: saved.slug, type: 'blog',
      }).catch(() => {});
    }
    return saved;
  }

  async findAll(opts: {
    page?: number;
    limit?: number;
    search?: string;
    tag?: string;
    featured?: boolean;
    published?: boolean;
    month?: string; // "YYYY-MM"
  }) {
    const { page = 1, limit = 9, search, tag, featured, month } = opts;
    const published = 'published' in opts ? opts.published : true;
    const qb = this.repo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('1=1')
      .orderBy('post.featured', 'DESC')
      .addOrderBy('post.publishedAt', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    if (published !== undefined) qb.andWhere('post.published = :published', { published });
    if (search) qb.andWhere('post.title ILIKE :search', { search: `%${search}%` });
    if (featured !== undefined) qb.andWhere('post.featured = :featured', { featured });
    if (tag) qb.andWhere(':tag = ANY(post.tags)', { tag });
    if (month) {
      const [y, m] = month.split('-').map(Number);
      const from = new Date(Date.UTC(y, m - 1, 1));
      const to = new Date(Date.UTC(y, m, 1));
      qb.andWhere('post.createdAt >= :from AND post.createdAt < :to', { from, to });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string): Promise<BlogPost> {
    const post = await this.repo.findOne({ where: { slug }, relations: ['author'] });
    if (!post) throw new NotFoundException('Post not found');
    await this.repo.increment({ id: post.id }, 'viewCount', 1);
    return post;
  }

  async findOne(id: string): Promise<BlogPost> {
    const post = await this.repo.findOne({ where: { id }, relations: ['author'] });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async update(id: string, dto: UpdatePostDto): Promise<BlogPost> {
    const post = await this.findOne(id);
    const wasPublished = post.published;
    if (dto.title && dto.title !== post.title) {
      post.slug = await this.generateSlug(dto.title, id);
    }
    if (dto.content) {
      post.readingTimeMinutes = this.estimateReadingTime(dto.content);
    }
    if (dto.published && !wasPublished) {
      post.publishedAt = new Date();
    }
    Object.assign(post, dto);
    const saved = await this.repo.save(post);
    if (dto.published && !wasPublished) {
      this.socialService.postContent({
        id: saved.id, title: saved.title, excerpt: saved.excerpt,
        slug: saved.slug, type: 'blog',
      }).catch(() => {});
    }
    return saved;
  }

  async remove(id: string): Promise<void> {
    const post = await this.findOne(id);
    await this.repo.remove(post);
  }

  async getRecent(limit = 3): Promise<BlogPost[]> {
    return this.repo.find({
      where: { published: true },
      order: { publishedAt: 'DESC' },
      take: limit,
      relations: ['author'],
    });
  }

  async getAllTags(): Promise<string[]> {
    const posts = await this.repo.find({ where: { published: true }, select: ['tags'] });
    const tags = new Set<string>();
    posts.forEach((p) => p.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }

  async getStats() {
    const total = await this.repo.count();
    const published = await this.repo.count({ where: { published: true } });
    const featured = await this.repo.count({ where: { featured: true } });
    return { total, published, featured };
  }

  private estimateReadingTime(content: string): number {
    const words = content.split(/\s+/).length;
    return Math.ceil(words / 200);
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
