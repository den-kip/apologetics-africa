import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ContactController } from './contact.controller';

@Module({
  imports: [BullModule.registerQueue({ name: 'mail' })],
  controllers: [ContactController],
})
export class ContactModule {}
