import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/create-app';

const server = express();
let appReady: Promise<void> | undefined;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  configureApp(app);
  await app.init();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!appReady) {
    appReady = bootstrap();
  }
  await appReady;
  server(req as unknown as express.Request, res as unknown as express.Response);
}
