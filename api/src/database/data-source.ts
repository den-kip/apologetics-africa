import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Resource } from '../resources/resource.entity';
import { Question } from '../questions/question.entity';
import { BlogPost } from '../blog/post.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: true,
  entities: [User, Resource, Question, BlogPost],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: [],
});
