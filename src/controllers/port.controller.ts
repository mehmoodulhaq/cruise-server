import { Controller, Post, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PortProcessorService } from '../services/port-processor.service';
import { PortEntry, ProcessFileResponse } from '../types/port.types';
import * as fs from 'fs';

@Controller('ports')
export class PortController {
  constructor(private readonly portProcessorService: PortProcessorService) {}

  @Post('process')
  async processPort(@Body('text') portText: string): Promise<PortEntry> {
    return this.portProcessorService.processEntry(portText);
  }

  @Post('process-file')
  @UseInterceptors(FileInterceptor('file'))
  async processFile(@UploadedFile() file: Express.Multer.File): Promise<ProcessFileResponse> {
    const results = await this.portProcessorService.processFile(file);
    
    // Save CSV
    const csvPath = 'processed_ports.csv';
    const csvContent = results.map(r => 
      `${r.port_name},${r.location},${r.country}`
    ).join('\n');
    fs.writeFileSync(csvPath, csvContent);

    // Save formatted text
    const txtPath = 'formatted_ports.txt';
    const txtContent = results.map(r => r.formatted).join('\n');
    fs.writeFileSync(txtPath, txtContent);

    return {
      message: 'Files processed successfully',
      csvPath,
      txtPath
    };
  }
}
