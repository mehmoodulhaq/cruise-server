
import { Module } from '@nestjs/common';
import { PortController } from './controllers/port.controller';
import { PortProcessorService } from './services/port-processor.service';
import { AppController } from './app.controller';
import { OllamaConfigProvider } from './providers/config.provider';
import { AppService } from './app.service';

@Module({
  imports:[],
  controllers: [AppController,PortController],
  providers: [OllamaConfigProvider,AppService,PortProcessorService],
})
export class AppModule {}
