import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// since the scope of test is limitted , I did not use the feature first architecture that has a module per feature

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configure CORS
  // app.enableCors({
  //   origin: [
  //     'http://localhost:3000',
  //     'http://localhost:5173',
  //     'http://127.0.0.1:3000',
  //     'http://127.0.0.1:5173'
  //   ],
  //   methods: ['GET', 'POST'],
  //   credentials: true,
  // });
  app.enableCors()
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
