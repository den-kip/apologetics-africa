import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum ResourceType {
  VIDEO    = 'video',
  PODCAST  = 'podcast',
  SERMON   = 'sermon',
  SESSION  = 'session',
  COURSE   = 'course',
  BOOK     = 'book',
  TOOL     = 'tool',
  // kept for backward-compat with existing data — do not use for new resources
  ARTICLE  = 'article',
}

export enum ResourceCategory {
  EXISTENCE_OF_GOD  = 'existence_of_god',
  RESURRECTION      = 'resurrection',
  BIBLE_RELIABILITY = 'bible_reliability',
  ISLAM             = 'islam',
  ATHEISM           = 'atheism',
  EVOLUTION         = 'evolution',
  MORALITY          = 'morality',
  SUFFERING         = 'suffering',
  WORLD_RELIGIONS   = 'world_religions',
  POSTMODERNISM     = 'postmodernism',
  GENERAL           = 'general',
}

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column('text')
  description: string;

  @Column('text', { nullable: true })
  content: string;

  @Column({ nullable: true })
  externalUrl: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'enum', enum: ResourceType, default: ResourceType.VIDEO })
  type: ResourceType;

  @Column({ type: 'enum', enum: ResourceCategory, default: ResourceCategory.GENERAL })
  category: ResourceCategory;

  @Column('simple-array', { nullable: true })
  tags: string[];

  /** Optional Bible book reference, e.g. "John", "Romans" */
  @Column({ nullable: true })
  bookOfBible: string;

  @Column({ default: false })
  featured: boolean;

  @Column({ default: true })
  published: boolean;

  @Column({ default: 0 })
  viewCount: number;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ nullable: true })
  authorId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
