import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Twilio } from "twilio";

@Injectable()
export class SmsService {
  private client: Twilio;
  private fromNumber: string;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>("TWILIO_ACCOUNT_SID");
    const authToken = this.configService.get<string>("TWILIO_AUTH_TOKEN");
    this.fromNumber = this.configService.get<string>("TWILIO_FROM_NUMBER", "");
    this.client = new Twilio(accountSid, authToken);
  }

  async sendOtp(to: string, code: string) {
    try {
      await this.client.messages.create({
        body: `NeuroLXP verification code: ${code}. It expires in 5 minutes.`,
        from: this.fromNumber,
        to,
      });
    } catch (error) {
      throw new InternalServerErrorException("Failed to send SMS OTP.");
    }
  }
}
