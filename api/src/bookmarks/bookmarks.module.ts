import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bookmark } from './bookmark.entity';
import { BlogPost } from '../blog/post.entity';
import { Resource } from '../resources/resource.entity';
import { Question } from '../questions/question.entity';
import { BookmarksService } from './bookmarks.service';
import { BookmarksController } from './bookmarks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Bookmark, BlogPost, Resource, Question])],
  providers: [BookmarksService],
  controllers: [BookmarksController],
})
export class BookmarksModule {}
