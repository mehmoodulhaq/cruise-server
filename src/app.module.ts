import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PortController } from './controllers/port.controller';
import { PortProcessorService } from './services/port-processor.service';
import { OllamaConfigProvider } from './providers/config.provider';
import { AppService } from './app.service';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, PortController],
  providers: [OllamaConfigProvider, AppService, PortProcessorService],
})
export class AppModule {}