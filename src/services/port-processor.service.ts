import { Inject, Injectable } from '@nestjs/common';
import { OllamaConfig, OLLAMA_CONFIG } from '../config/ollama.config';
import axios from 'axios';
import * as fs from 'fs';
import * as csv from 'csv-parse';
import { PortEntry } from '../types/port.types';

enum Action {
    PARSE = 'parse',
    SEARCH = 'search',
    FORMAT = 'format',
    VALIDATE = 'validate'
}


@Injectable()
export class PortProcessorService {


    constructor(
        @Inject(OLLAMA_CONFIG)
        private readonly ollamaConfig: OllamaConfig
    ) { }
    private generatePrompt(action: Action, content: string): string {
        const prompts: Record<Action, string> = {
            [Action.PARSE]: `
        Task: Parse the port information into components.
        Input: ${content}
        Respond in JSON format with these fields:
        {"port_name": "", "location": "", "country": ""}
        Think step by step:
        1. Identify the main port name
        2. Look for location details (city, island, region)
        3. Find country name
        Only output the JSON, no explanation.
      `,
            [Action.SEARCH]: `
        Task: Find the country and location for this port if missing.
        Input port: ${content}
        Output format: {"country": "", "location": ""}
        Think step by step:
        1. Is this a well-known port?
        2. What country is it typically in?
        3. Are there any notable location details?
        Only output the JSON, no explanation.
      `,
            [Action.FORMAT]: `
        Task: Format port information consistently.
        Input: ${content}
        Format as: <Port name> (<location if any>), <country>
        If location is missing, omit parentheses.
        Only output the formatted string, no explanation.
      `,
            [Action.VALIDATE]: `
        Task: Validate if this port entry looks correct.
        Input: ${content}
        Output: {"valid": true/false, "reason": ""}
        Check:
        1. Port name looks realistic
        2. Country is a real country
        3. Format is consistent
        Only output the JSON, no explanation.
      `
        };
        return prompts[action];
    }

    private async callOllama(prompt: string): Promise<string> {
        const response = await axios.post(this.ollamaConfig.url, {
            model: this.ollamaConfig.model,
            prompt,
            stream: false
        });
        return response.data.response;
    }

    async processEntry(entry: string): Promise<PortEntry> {
        // Parse components
        const parsePrompt = this.generatePrompt(Action.PARSE, entry);
        const parsed = JSON.parse(await this.callOllama(parsePrompt));

        // Search for missing info if needed
        if (!parsed.country || !parsed.location) {
            const searchPrompt = this.generatePrompt(Action.SEARCH, parsed.port_name);
            const additionalInfo = JSON.parse(await this.callOllama(searchPrompt));
            parsed.country = parsed.country || additionalInfo.country;
            parsed.location = parsed.location || additionalInfo.location;
        }

        // Format consistently
        const formatPrompt = this.generatePrompt(Action.FORMAT, JSON.stringify(parsed));
        const formatted = await this.callOllama(formatPrompt);

        // Validate
        const validatePrompt = this.generatePrompt(Action.VALIDATE, formatted);
        const validation = JSON.parse(await this.callOllama(validatePrompt));

        return {
            formatted: formatted.trim(),
            port_name: parsed.port_name,
            location: parsed.location,
            country: parsed.country,
            valid: validation.valid
        };
    }

    async processFile(file: Express.Multer.File): Promise<PortEntry[]> {
        return new Promise((resolve, reject) => {
            const results: PortEntry[] = [];
            fs.createReadStream(file.path)
                .pipe(csv.parse({ columns: false }))
                .on('data', async (row) => {
                    const result = await this.processEntry(row[0]);
                    results.push(result);
                })
                .on('end', () => {
                    resolve(results);
                })
                .on('error', reject);
        });
    }
}
