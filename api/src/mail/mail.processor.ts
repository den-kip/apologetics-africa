import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { MailService } from './mail.service';

@Processor('mail')
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private mailService: MailService) {}

  @Process('question-received')
  async handleQuestionReceived(job: Job) {
    const { to, name, questionTitle } = job.data;
    try {
      await this.mailService.sendQuestionReceived(to, name, questionTitle);
      this.logger.log(`Sent question-received email to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send question-received email: ${err.message}`);
      throw err;
    }
  }

  @Process('question-answered')
  async handleQuestionAnswered(job: Job) {
    const { to, name, questionTitle, questionSlug } = job.data;
    try {
      await this.mailService.sendQuestionAnswered(to, name, questionTitle, questionSlug);
      this.logger.log(`Sent question-answered email to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send question-answered email: ${err.message}`);
      throw err;
    }
  }

  @Process('contact-form')
  async handleContactForm(job: Job) {
    const { name, email, subject, message } = job.data;
    try {
      await this.mailService.sendContactForm(name, email, subject, message);
      this.logger.log(`Sent contact form email from ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send contact form email: ${err.message}`);
      throw err;
    }
  }
}
