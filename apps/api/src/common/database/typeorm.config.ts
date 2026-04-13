import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT || 5432),
  username: process.env.POSTGRES_USER,
  password: String(process.env.POSTGRES_PASSWORD || ""),
  database: process.env.POSTGRES_DB,
  autoLoadEntities: true,
  synchronize: false,
};