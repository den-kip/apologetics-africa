import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogPost } from './post.entity';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [TypeOrmModule.forFeature([BlogPost]), SocialModule],
  providers: [BlogService],
  controllers: [BlogController],
  exports: [BlogService],
})
export class BlogModule {}
