import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  app.getHttpAdapter().getInstance().set('trust proxy', 'uniquelocal');
  app.useSecurityHeaders({
    strictTransportSecurity: { maxAge: 63072000, preload: true },
    xFrameOptions: { action: 'deny' },
  });
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 3600,
  });
  await app.listen(process.env.GATEWAY_PORT ?? 3001);
}
void bootstrap();
