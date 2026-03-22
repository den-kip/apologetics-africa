import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('MAIL_HOST', 'mailhog'),
      port: config.get<number>('MAIL_PORT', 1025),
      secure: false,
      ignoreTLS: true,
    });
  }

  async sendQuestionReceived(to: string, name: string, questionTitle: string) {
    await this.transporter.sendMail({
      from: this.config.get('MAIL_FROM'),
      to,
      subject: 'Your question has been received — Apologetics Africa',
      html: this.questionReceivedTemplate(name, questionTitle),
    });
  }

  async sendContactForm(name: string, email: string, subject: string | undefined, message: string) {
    const adminEmail = this.config.get('MAIL_FROM', 'noreply@apologeticsafrica.com');
    await this.transporter.sendMail({
      from: this.config.get('MAIL_FROM'),
      to: adminEmail,
      replyTo: email,
      subject: subject ? `Contact: ${subject}` : `Contact from ${name} — Apologetics Africa`,
      html: this.contactFormTemplate(name, email, subject, message),
    });
  }

  async sendQuestionAnswered(
    to: string,
    name: string,
    questionTitle: string,
    questionSlug: string,
  ) {
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const url = `${frontendUrl}/questions/${questionSlug}`;
    await this.transporter.sendMail({
      from: this.config.get('MAIL_FROM'),
      to,
      subject: 'Your question has been answered — Apologetics Africa',
      html: this.questionAnsweredTemplate(name, questionTitle, url),
    });
  }

  private contactFormTemplate(name: string, email: string, subject: string | undefined, message: string): string {
    return `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#1e40af;">New Contact Message</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <tr><td style="padding:6px 0;color:#6b7280;width:80px;">From</td><td style="padding:6px 0;font-weight:600;">${name}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;"><a href="mailto:${email}" style="color:#3b82f6;">${email}</a></td></tr>
          ${subject ? `<tr><td style="padding:6px 0;color:#6b7280;">Subject</td><td style="padding:6px 0;">${subject}</td></tr>` : ''}
        </table>
        <div style="background:#f8fafc;border-left:4px solid #3b82f6;padding:16px;border-radius:4px;white-space:pre-wrap;">${message}</div>
        <p style="margin-top:16px;color:#6b7280;font-size:13px;">Reply directly to this email to respond to ${name}.</p>
        <hr style="margin-top:24px;"/>
        <p style="color:#6b7280;font-size:12px;">Apologetics Africa — Contact Form</p>
      </div>
    `;
  }

  private questionReceivedTemplate(name: string, title: string): string {
    return `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#1e40af;">Thank you, ${name}!</h2>
        <p>We've received your question:</p>
        <blockquote style="border-left:4px solid #3b82f6;padding-left:16px;color:#374151;">
          <em>"${title}"</em>
        </blockquote>
        <p>Our apologetics team will review it and respond as soon as possible. Questions typically receive responses within 3–7 business days.</p>
        <p>In the meantime, explore our <a href="${this.config.get('FRONTEND_URL')}/resources" style="color:#3b82f6;">resource library</a> for answers to common questions.</p>
        <hr/>
        <p style="color:#6b7280;font-size:14px;">Apologetics Africa — Defending the faith across the continent</p>
      </div>
    `;
  }

  private questionAnsweredTemplate(name: string, title: string, url: string): string {
    return `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#1e40af;">Your question has been answered, ${name}!</h2>
        <p>We've answered your question:</p>
        <blockquote style="border-left:4px solid #3b82f6;padding-left:16px;color:#374151;">
          <em>"${title}"</em>
        </blockquote>
        <a href="${url}" style="display:inline-block;background:#3b82f6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">
          Read the Answer →
        </a>
        <p>We hope this response strengthens your faith and equips you in your conversations.</p>
        <hr/>
        <p style="color:#6b7280;font-size:14px;">Apologetics Africa — Defending the faith across the continent</p>
      </div>
    `;
  }
}
