import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum BookmarkType {
  BLOG = 'blog',
  RESOURCE = 'resource',
  QUESTION = 'question',
}

@Entity('bookmarks')
@Unique(['userId', 'type', 'targetId'])
export class Bookmark {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: BookmarkType })
  type: BookmarkType;

  @Column()
  targetId: string;

  @CreateDateColumn()
  createdAt: Date;
}
