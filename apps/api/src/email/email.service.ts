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
      const errorMessage = Array.isArray(error?.response?.body?.errors)
        ? error.response.body.errors.map((err: any) => err.message).join("; ")
        : error?.response?.body?.message || error?.message ||
          "Failed to send email. Verify SendGrid API key and sender identity.";
      throw new InternalServerErrorException(errorMessage);
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
    const subject = "Welcome to NeuroLXP – Platform Admin Sign-In";
    const html = `
      <div style="font-family:Arial,sans-serif;color:#0f172a;">
        <h2>Welcome to NeuroLXP</h2>
        <p>Your platform admin access has been created. Click the link below to sign in and complete your first login.</p>
        <p><a href="${link}" style="color:#2563eb;">${link}</a></p>
        <p>This link will expire in 10 minutes.</p>
        <p>If you did not expect this email, please ignore it or contact support.</p>
      </div>
    `;
    await this.sendEmail(to, subject, html);
  }
}
