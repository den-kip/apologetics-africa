import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('social_posts')
export class SocialPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  platform: string; // 'facebook' | 'twitter' | 'linkedin'

  @Column()
  contentType: string; // 'resource' | 'blog'

  @Column({ nullable: true })
  contentId: string;

  @Column({ nullable: true })
  contentTitle: string;

  @Column('text')
  message: string;

  @Column({ default: 'success' })
  status: string; // 'success' | 'failed'

  @Column('text', { nullable: true })
  error: string;

  @CreateDateColumn()
  postedAt: Date;
}
