import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { Question } from './question.entity';
import { QuestionComment } from './question-comment.entity';
import { CommentReaction } from './comment-reaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, QuestionComment, CommentReaction]),
    BullModule.registerQueue({ name: 'mail' }),
  ],
  providers: [QuestionsService],
  controllers: [QuestionsController],
  exports: [QuestionsService],
})
export class QuestionsModule {}
