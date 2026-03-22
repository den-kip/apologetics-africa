import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Topic } from '../topics/topic.entity';

export enum QuestionStatus {
  PENDING = 'pending',
  ANSWERED = 'answered',
  REJECTED = 'rejected',
}

export enum QuestionCategory {
  SESSION = 'session',
  TOPIC = 'topic',
  THEME = 'theme',
  GENERAL = 'general',
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ unique: true, nullable: true })
  slug: string;

  @Column('text')
  body: string;

  @Column()
  askerName: string;

  @Column()
  askerEmail: string;

  @Column({ type: 'enum', enum: QuestionStatus, default: QuestionStatus.PENDING })
  status: QuestionStatus;

  @Column('text', { nullable: true })
  answer: string;

  @Column({ nullable: true })
  answeredAt: Date;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ default: false })
  featured: boolean;

  @Column({ default: false })
  anonymous: boolean;

  @Column({ type: 'enum', enum: QuestionCategory, default: QuestionCategory.GENERAL })
  category: QuestionCategory;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: false })
  locked: boolean;

  @Column({ default: false })
  allowContributions: boolean;

  @Column({ default: false })
  hidden: boolean;

  @ManyToOne(() => Topic, { nullable: true, eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'topicId' })
  topic: Topic;

  @Column({ nullable: true })
  topicId: string;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'answeredById' })
  answeredBy: User;

  @Column({ nullable: true })
  answeredById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
