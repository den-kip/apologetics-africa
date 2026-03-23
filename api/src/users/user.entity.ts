import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  USER = 'user',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  middleName: string;

  @Column({ nullable: true })
  lastName: string;

  // Kept for backwards compat (chat messages, comments use authorName from user.name)
  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true, unique: true })
  username: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  alias: string;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  deactivatedAt: Date | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column()
  @Exclude()
  password: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  @Column({ nullable: true })
  @Exclude()
  resetPasswordToken: string;

  @Column({ nullable: true })
  @Exclude()
  resetPasswordExpires: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
