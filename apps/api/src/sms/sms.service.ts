import { Injectable, InternalServerErrorException, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as https from "https";

@Injectable()
export class SmsService {
  private apiKey: string;
  private senderId: string;
  private route: string;
  private countryCode: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>("MSG91_API_KEY", "");
    this.senderId = this.configService.get<string>("MSG91_SENDER_ID", "NWLXP");
    this.route = this.configService.get<string>("MSG91_ROUTE", "4");
    this.countryCode = this.configService.get<string>("MSG91_COUNTRY_CODE", "91");

    if (!this.apiKey) {
      throw new Error("MSG91_API_KEY must be configured to send SMS OTPs.");
    }
  }

  async sendOtp(to: string, code: string) {
    const normalizedTo = to.replace(/^\+/, "");
    if (!normalizedTo.match(/^\d{8,15}$/)) {
      throw new BadRequestException("Phone number must include country code and contain only digits.");
    }

    const payload = JSON.stringify({
      sender: this.senderId,
      route: this.route,
      country: this.countryCode,
      sms: [
        {
          message: `NeuroLXP verification code: ${code}. It expires in 5 minutes.`,
          to: [normalizedTo],
        },
      ],
    });

    await new Promise<void>((resolve, reject) => {
      const request = https.request(
        {
          hostname: "api.msg91.com",
          path: "/api/v2/sendsms",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authkey: this.apiKey,
            "Content-Length": Buffer.byteLength(payload),
          },
        },
        (res) => {
          let responseBody = "";
          res.on("data", (chunk) => {
            responseBody += chunk;
          });
          res.on("end", () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              return resolve();
            }
            reject(new Error(`MSG91 SMS request failed (${res.statusCode}): ${responseBody}`));
          });
        },
      );

      request.on("error", (error) => reject(error));
      request.write(payload);
      request.end();
    }).catch(() => {
      throw new InternalServerErrorException("Failed to send SMS OTP.");
    });
  }
}
