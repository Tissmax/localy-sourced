import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(4001, () => {
    console.log('running on port 4001');
  });}

void bootstrap();
