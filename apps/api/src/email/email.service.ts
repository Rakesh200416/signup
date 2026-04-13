import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as sgMail from "@sendgrid/mail";

@Injectable()
export class EmailService {
  private fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("SENDGRID_API_KEY");
    if (!apiKey) {
      throw new InternalServerErrorException("SendGrid API key is not configured.");
    }
    sgMail.setApiKey(apiKey);
    this.fromAddress = this.configService.get<string>("SENDGRID_FROM_EMAIL", "no-reply@neuro-lxp.com");
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      await sgMail.send({
        to,
        from: this.fromAddress,
        subject,
        html,
      });
    } catch (error: any) {
      const sendGridError = error?.response?.body || error;
      console.error("SendGrid email send failed:", sendGridError);
      if (error?.response?.body?.errors) {
        console.error("SendGrid error details:", JSON.stringify(error.response.body.errors));
      }
      throw new InternalServerErrorException(
        "Failed to send email. Verify SendGrid API key and sender identity.",
      );
    }
  }

  async sendOtpEmail(to: string, code: string, purpose: string) {
    const subject = `NeuroLXP ${purpose} verification code`;
    const html = `
      <div style="font-family:Arial,sans-serif;color:#0f172a;">
        <h2>NeuroLXP ${purpose}</h2>
        <p>Your one-time verification code is:</p>
        <p style="font-size:28px;font-weight:bold;margin:24px 0;">${code}</p>
        <p>This code expires in 5 minutes.</p>
      </div>
    `;
    await this.sendEmail(to, subject, html);
  }

  async sendMagicLink(to: string, link: string) {
    const subject = "NeuroLXP Super Admin Sign-In Link";
    const html = `
      <div style="font-family:Arial,sans-serif;color:#0f172a;">
        <h2>Secure sign-in link</h2>
        <p>Click the link below to sign in to NeuroLXP. It expires in 10 minutes.</p>
        <p><a href="${link}" style="color:#2563eb;">${link}</a></p>
        <p>If you did not request this, ignore this message.</p>
      </div>
    `;
    await this.sendEmail(to, subject, html);
  }
}
