import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { LiveSession } from './live-session.entity';
import { User } from '../users/user.entity';
import { ChatReaction } from './chat-reaction.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  sessionId: string;

  @ManyToOne(() => LiveSession, (s) => s.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: LiveSession;

  @Column('uuid', { nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  authorName: string;

  @Column('text')
  body: string;

  @Column('uuid', { nullable: true })
  replyToId: string;

  @ManyToOne(() => ChatMessage, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'replyToId' })
  replyTo: ChatMessage;

  @Column({ default: false })
  pinned: boolean;

  @Column({ default: false })
  deleted: boolean;

  @OneToMany(() => ChatReaction, (r) => r.message, { eager: false })
  reactions: ChatReaction[];

  @CreateDateColumn()
  createdAt: Date;
}
