import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export class ContactDto {
  @IsString() @MinLength(2) @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional() @IsString() @MaxLength(200)
  subject?: string;

  @IsString() @MinLength(10) @MaxLength(2000)
  message: string;
}

@ApiTags('contact')
@Controller({ path: 'contact', version: '1' })
export class ContactController {
  constructor(@InjectQueue('mail') private mailQueue: Queue) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Send a contact message' })
  async send(@Body() dto: ContactDto) {
    await this.mailQueue.add('contact-form', dto);
  }
}
