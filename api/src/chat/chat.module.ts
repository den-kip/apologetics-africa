import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LiveSession } from './live-session.entity';
import { ChatMessage } from './chat-message.entity';
import { ChatReaction } from './chat-reaction.entity';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { SessionsController } from './sessions.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LiveSession, ChatMessage, ChatReaction]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
      }),
    }),
    UsersModule,
  ],
  providers: [ChatService, ChatGateway],
  controllers: [SessionsController],
})
export class ChatModule {}
