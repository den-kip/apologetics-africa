import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';
import { ChatMessage } from './chat-message.entity';

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

@Entity('live_sessions')
export class LiveSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt: Date;

  @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.SCHEDULED })
  status: SessionStatus;

  @Column({ type: 'text', nullable: true })
  posterUrl: string | null;

  @Column({ type: 'text', nullable: true })
  link: string | null;

  @OneToMany(() => ChatMessage, (m) => m.session)
  messages: ChatMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
