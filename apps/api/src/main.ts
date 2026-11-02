import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { API_PREFIX, applyGlobalSetup } from './app.setup';
import { buildAllowedOrigins } from './common/cors';
import type { Env } from './config/env.schema';

const SWAGGER_PATH = `${API_PREFIX}/docs`;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  applyGlobalSetup(app);
  // Uploaded covers are public images that the web app (another origin) embeds.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({ origin: buildAllowedOrigins(config.get('WEB_URL', { infer: true })) });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Book Exchange API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(SWAGGER_PATH, app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
