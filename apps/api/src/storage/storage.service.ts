import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { promises as fs } from "fs";
import { join } from "path";

@Injectable()
export class StorageService {
  private s3Client: S3Client | null = null;
  private bucket: string | undefined;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>("AWS_REGION");
    this.bucket = this.configService.get<string>("AWS_S3_BUCKET");
    const accessKey = this.configService.get<string>("AWS_ACCESS_KEY_ID");
    const secretKey = this.configService.get<string>("AWS_SECRET_ACCESS_KEY");

    if (region && this.bucket && accessKey && secretKey) {
      this.s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
      });
    }
  }

  async uploadGovtId(filename: string, buffer: Buffer, contentType: string) {
    const key = `govt-ids/${Date.now()}-${filename}`;
    if (this.s3Client && this.bucket) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            ACL: "private",
          }),
        );
        return `s3://${this.bucket}/${key}`;
      } catch (error) {
        throw new InternalServerErrorException("Failed to upload file to S3.");
      }
    }

    try {
      const uploadsDir = join(process.cwd(), "uploads", "govt-ids");
      await fs.mkdir(uploadsDir, { recursive: true });
      const path = join(uploadsDir, key.replace(/\//g, "-"));
      await fs.writeFile(path, buffer);
      return `file://${path}`;
    } catch (error) {
      throw new InternalServerErrorException("Failed to store government ID locally.");
    }
  }

  async uploadProfilePhoto(filename: string, buffer: Buffer, contentType: string) {
    const key = `profile-photos/${Date.now()}-${filename}`;
    if (this.s3Client && this.bucket) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            ACL: "private",
          }),
        );
        return `s3://${this.bucket}/${key}`;
      } catch (error) {
        throw new InternalServerErrorException("Failed to upload profile photo to S3.");
      }
    }

    try {
      const uploadsDir = join(process.cwd(), "uploads", "profile-photos");
      await fs.mkdir(uploadsDir, { recursive: true });
      const path = join(uploadsDir, key.replace(/\//g, "-"));
      await fs.writeFile(path, buffer);
      return `file://${path}`;
    } catch (error) {
      throw new InternalServerErrorException("Failed to store profile photo locally.");
    }
  }
}
