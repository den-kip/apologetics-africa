import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ResourcesModule } from './resources/resources.module';
import { QuestionsModule } from './questions/questions.module';
import { BlogModule } from './blog/blog.module';
import { MailModule } from './mail/mail.module';
import { SettingsModule } from './settings/settings.module';
import { UploadModule } from './upload/upload.module';
import { TopicsModule } from './topics/topics.module';
import { SocialModule } from './social/social.module';
import { ContactModule } from './contact/contact.module';
import { ChatModule } from './chat/chat.module';
import databaseConfig from './config/database.config';
import appConfig from './config/app.config';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig],
      envFilePath: ['.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),

    // Cache (Redis)
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisUrl = new URL(config.get<string>('REDIS_URL', 'redis://redis:6379'));
        return {
          store: await redisStore({
            host: redisUrl.hostname,
            port: parseInt(redisUrl.port) || 6379,
          }),
          ttl: 60 * 5,
        };
      },
    }),

    // Queue (BullMQ)
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: config.get('REDIS_URL'),
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),

    // Feature modules
    AuthModule,
    UsersModule,
    ResourcesModule,
    QuestionsModule,
    BlogModule,
    MailModule,
    SettingsModule,
    UploadModule,
    TopicsModule,
    SocialModule,
    ContactModule,
    ChatModule,
  ],
})
export class AppModule {}
