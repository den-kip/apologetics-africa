import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import slugify from 'slugify';
import { Resource, ResourceType, ResourceCategory } from './resource.entity';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { SocialService } from '../social/social.service';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource) private repo: Repository<Resource>,
    private readonly socialService: SocialService,
  ) {}

  async create(dto: CreateResourceDto, authorId?: string): Promise<Resource> {
    const slug = await this.generateSlug(dto.title);
    const resource = this.repo.create({ ...dto, slug, authorId });
    const saved = await this.repo.save(resource);
    if (dto.published !== false) {
      this.socialService.postContent({
        id: saved.id, title: saved.title, excerpt: saved.description,
        slug: saved.slug, type: 'resource',
      }).catch(() => {});
    }
    return saved;
  }

  async findAll(opts: {
    page?: number;
    limit?: number;
    type?: ResourceType;
    category?: ResourceCategory;
    search?: string;
    tag?: string;
    bookOfBible?: string;
    year?: number;
    month?: number;
    featured?: boolean;
    published?: boolean;
  }) {
    const {
      page = 1, limit = 12, type, category, search,
      tag, bookOfBible, year, month, featured,
    } = opts;
    const published = 'published' in opts ? opts.published : true;

    const qb = this.repo
      .createQueryBuilder('resource')
      .leftJoinAndSelect('resource.author', 'author')
      .where('1=1')
      .orderBy('resource.featured', 'DESC')
      .addOrderBy('resource.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    if (published !== undefined) qb.andWhere('resource.published = :published', { published });
    if (type) qb.andWhere('resource.type = :type', { type });
    if (category) qb.andWhere('resource.category = :category', { category });
    if (search) qb.andWhere('resource.title ILIKE :search', { search: `%${search}%` });
    if (featured !== undefined) qb.andWhere('resource.featured = :featured', { featured });
    if (bookOfBible) qb.andWhere('resource.bookOfBible ILIKE :book', { book: bookOfBible });
    if (tag) qb.andWhere(':tag = ANY(string_to_array(resource.tags, \',\'))', { tag });
    if (year) {
      qb.andWhere('EXTRACT(YEAR FROM resource.createdAt) = :year', { year });
    }
    if (month) {
      qb.andWhere('EXTRACT(MONTH FROM resource.createdAt) = :month', { month });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string): Promise<Resource> {
    const resource = await this.repo.findOne({
      where: { slug },
      relations: ['author'],
    });
    if (!resource) throw new NotFoundException('Resource not found');
    await this.repo.increment({ id: resource.id }, 'viewCount', 1);
    return resource;
  }

  async findOne(id: string): Promise<Resource> {
    const resource = await this.repo.findOne({ where: { id }, relations: ['author'] });
    if (!resource) throw new NotFoundException('Resource not found');
    return resource;
  }

  async update(id: string, dto: UpdateResourceDto): Promise<Resource> {
    const resource = await this.findOne(id);
    const wasPublished = resource.published;
    if (dto.title && dto.title !== resource.title) {
      resource.slug = await this.generateSlug(dto.title, id);
    }
    Object.assign(resource, dto);
    const saved = await this.repo.save(resource);
    if (dto.published && !wasPublished) {
      this.socialService.postContent({
        id: saved.id, title: saved.title, excerpt: saved.description,
        slug: saved.slug, type: 'resource',
      }).catch(() => {});
    }
    return saved;
  }

  async remove(id: string): Promise<void> {
    const resource = await this.findOne(id);
    await this.repo.remove(resource);
  }

  async getFeatured(limit = 6): Promise<Resource[]> {
    return this.repo.find({
      where: { featured: true, published: true },
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['author'],
    });
  }

  async getStats() {
    const total = await this.repo.count();
    const published = await this.repo.count({ where: { published: true } });
    const featured = await this.repo.count({ where: { featured: true } });
    return { total, published, featured };
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
