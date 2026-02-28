import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { NestExpressApplication } from '@nestjs/platform-express';

let cachedServer: any;

async function bootstrap() {
  if (cachedServer) return cachedServer;

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new ConsoleLogger(),
  });

  const configService = app.get(ConfigService);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  // Very permissive CORS for Vercel subdomains
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      // Allow specific domain AND any vercel.app subdomain
      if (
        origin === 'https://queens-azure-seven.vercel.app' ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all for now to debug
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, Cookie, X-Requested-With',
  });

  await app.init();
  cachedServer = app.getHttpAdapter().getInstance();
  return cachedServer;
}

export default async (req: any, res: any) => {
  const server = await bootstrap();
  return server(req, res);
};
