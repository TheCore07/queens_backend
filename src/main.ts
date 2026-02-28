import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new ConsoleLogger(),
  });

  const configService = app.get(ConfigService);

  // Security: Helmet with CORS-friendly settings
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Disable CSP for API
  }));
  
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

  // Explicit CORS Configuration
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'https://queens-azure-seven.vercel.app';
  
  app.enableCors({
    origin: [
      'http://localhost:5173',
      frontendUrl,
      /\.vercel\.app$/, // Allow all vercel.app subdomains for flexibility
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, Cookie, X-Requested-With',
    exposedHeaders: ['Set-Cookie'],
  });

  const config = new DocumentBuilder()
    .setTitle('Queens API')
    .setDescription('The Queens Game API description')
    .setVersion('1.0')
    .addTag('queens')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  if (process.env.VERCEL) {
    await app.init();
    return app.getHttpAdapter().getInstance();
  }

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);
}

// Export for Vercel
let server: any;
export default async (req: any, res: any) => {
  if (!server) {
    server = await bootstrap();
  }
  return server(req, res);
};

// Local development
if (!process.env.VERCEL) {
  bootstrap().catch((err) => {
    console.error('Error starting application:', err);
    process.exit(1);
  });
}
