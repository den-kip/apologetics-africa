import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { QuestionComment } from './question-comment.entity';

@Entity('comment_reactions')
@Unique(['commentId', 'userId', 'emoji'])
export class CommentReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  commentId: string;

  @ManyToOne(() => QuestionComment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentId' })
  comment: QuestionComment;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 10 })
  emoji: string;

  @CreateDateColumn()
  createdAt: Date;
}
