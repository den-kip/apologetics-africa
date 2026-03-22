import { Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import slugify from 'slugify';
import { Topic, TopicType } from './topic.entity';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

const SEED_TOPICS: { name: string; type: TopicType; order: number }[] = [
  { name: 'Existence of God',  type: TopicType.TOPIC, order: 0 },
  { name: 'Resurrection',      type: TopicType.TOPIC, order: 1 },
  { name: 'Bible Reliability', type: TopicType.TOPIC, order: 2 },
  { name: 'Islam & Faith',     type: TopicType.TOPIC, order: 3 },
  { name: 'Evolution',         type: TopicType.TOPIC, order: 4 },
  { name: 'Atheism',           type: TopicType.TOPIC, order: 5 },
  { name: 'World Religions',   type: TopicType.TOPIC, order: 6 },
  { name: 'Suffering & Evil',  type: TopicType.THEME, order: 0 },
  { name: 'Morality',          type: TopicType.THEME, order: 1 },
  { name: 'Postmodernism',     type: TopicType.THEME, order: 2 },
];

@Injectable()
export class TopicsService implements OnApplicationBootstrap {
  constructor(@InjectRepository(Topic) private repo: Repository<Topic>) {}

  async onApplicationBootstrap() {
    for (const seed of SEED_TOPICS) {
      const slug = slugify(seed.name, { lower: true, strict: true });
      const existing = await this.repo.findOne({ where: { slug } });
      if (!existing) {
        await this.repo.save(this.repo.create({ ...seed, slug }));
      }
    }
  }

  findAll(type?: TopicType): Promise<Topic[]> {
    const where: any = { published: true };
    if (type) where.type = type;
    return this.repo.find({ where, order: { order: 'ASC', name: 'ASC' } });
  }

  findAllAdmin(): Promise<Topic[]> {
    return this.repo.find({ order: { type: 'ASC', order: 'ASC', name: 'ASC' } });
  }

  async create(dto: CreateTopicDto): Promise<Topic> {
    const slug = await this.uniqueSlug(dto.name);
    return this.repo.save(this.repo.create({ ...dto, slug }));
  }

  async update(id: string, dto: UpdateTopicDto): Promise<Topic> {
    const topic = await this.findOne(id);
    if (dto.name && dto.name !== topic.name) {
      topic.slug = await this.uniqueSlug(dto.name, id);
    }
    Object.assign(topic, dto);
    return this.repo.save(topic);
  }

  async remove(id: string): Promise<void> {
    const topic = await this.findOne(id);
    await this.repo.remove(topic);
  }

  async findOne(id: string): Promise<Topic> {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Topic not found');
    return t;
  }

  private async uniqueSlug(name: string, excludeId?: string): Promise<string> {
    let base = slugify(name, { lower: true, strict: true });
    let count = 0;
    while (true) {
      const candidate = count === 0 ? base : `${base}-${count}`;
      const existing = await this.repo.findOne({ where: { slug: candidate } });
      if (!existing || existing.id === excludeId) return candidate;
      count++;
    }
  }
}
