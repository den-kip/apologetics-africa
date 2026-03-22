import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, Unique, CreateDateColumn,
} from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { User } from '../users/user.entity';

@Entity('chat_reactions')
@Unique(['messageId', 'userId', 'emoji'])
export class ChatReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  messageId: string;

  @ManyToOne(() => ChatMessage, (m) => m.reactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message: ChatMessage;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 10 })
  emoji: string;

  @CreateDateColumn()
  createdAt: Date;
}
