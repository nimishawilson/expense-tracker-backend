import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

export interface FriendRequestMail {
  to: string;
  senderName: string;
  link: string;
  recipientRegistered: boolean;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    const port = Number(config.get('SMTP_PORT') ?? 1025);
    const user = config.get<string>('SMTP_USER');
    this.transporter = createTransport({
      host: config.get<string>('SMTP_HOST') ?? 'localhost',
      port,
      secure: port === 465,
      auth: user ? { user, pass: config.get<string>('SMTP_PASS') } : undefined,
    });
    this.from =
      config.get<string>('MAIL_FROM') ??
      'Expense Tracker <no-reply@expense-tracker.local>';
  }

  /**
   * Never throws: a mail outage must not fail the API call that triggered it.
   * Returns whether the message was handed to the SMTP server.
   */
  async sendFriendRequest(mail: FriendRequestMail): Promise<boolean> {
    const sender = escapeHtml(mail.senderName);
    const action = mail.recipientRegistered
      ? 'Open the link below to accept or decline.'
      : 'Create an account with this email address, then open the link below to accept or decline.';

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: mail.to,
        subject: `${mail.senderName} wants to add you as a friend`,
        text: `${mail.senderName} sent you a friend request on Expense Tracker.\n\n${action}\n${mail.link}\n\nIf you don't know this person, you can ignore this email.`,
        html: `<p><strong>${sender}</strong> sent you a friend request on Expense Tracker.</p><p>${action}</p><p><a href="${escapeHtml(mail.link)}">Respond to request</a></p><p>If you don't know this person, you can ignore this email.</p>`,
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send friend request email: ${(error as Error).message}`,
      );
      return false;
    }
  }
}
