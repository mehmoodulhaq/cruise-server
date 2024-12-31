// import { flatten, Inject, Injectable } from '@nestjs/common';
// import { OllamaConfig, OLLAMA_CONFIG } from '../config/ollama.config';
// import axios from 'axios';
// import * as fs from 'fs';
// import * as csv from 'csv-parse';
// import { PortEntry } from '../types/port.types';
// import { finished } from 'stream/promises';
// import { Readable } from 'stream';

enum Action {
    PARSE = 'parse',
    SEARCH = 'search',
    FORMAT = 'format',
    VALIDATE = 'validate'
}


// @Injectable()
// export class PortProcessorService {


//     constructor(
//         @Inject(OLLAMA_CONFIG)
//         private readonly ollamaConfig: OllamaConfig
//     ) { }
//     private generatePrompt(action: Action, content: string): string {
//         const prompts: Record<Action, string> = {
//             [Action.PARSE]: `
//         Task: Parse the port information into components.
//         Input: ${content}
//         Respond in JSON format with these fields:
//         {"port_name": "", "location": "", "country": ""}
//         Think step by step:
//         1. Identify the main port name
//         2. Look for location details (city, island, region)
//         3. Find country name
//         Only output the JSON, no explanation.
//       `,
//             [Action.SEARCH]: `
//         Task: Find the country and location for this port if missing.
//         Input port: ${content}
//         Output format: {"country": "", "location": ""}
//         Think step by step:
//         1. Is this a well-known port?
//         2. What country is it typically in?
//         3. Are there any notable location details?
//         Only output the JSON, no explanation.
//       `,
//             [Action.FORMAT]: `
//         Task: Format port information consistently.
//         Input: ${content}
//         Format as: <Port name> (<location if any>), <country>
//         If location is missing, omit parentheses.
//         Only output the formatted string, no explanation.
//       `,
//             [Action.VALIDATE]: `
//         Task: Validate if this port entry looks correct.
//         Input: ${content}
//         Output: {"valid": true/false, "reason": ""}
//         Check:
//         1. Port name looks realistic
//         2. Country is a real country
//         3. Format is consistent
//         Only output the JSON, no explanation.
//       `
//         };
//         return prompts[action];
//     }

//     private async callOllama(prompt: string): Promise<string> {
//         const response = await axios.post(this.ollamaConfig.url, {
//             model: this.ollamaConfig.model,
//             prompt,
//             stream: false
//         });
//         return response.data.response;
//     }

//     async processEntry(entry: string): Promise<PortEntry> {
//         // Parse components
//         const parsePrompt = this.generatePrompt(Action.PARSE, entry);
//         const parsed = JSON.parse(await this.callOllama(parsePrompt));

//         // Search for missing info if needed
//         if (!parsed.country || !parsed.location) {
//             const searchPrompt = this.generatePrompt(Action.SEARCH, parsed.port_name);
//             const additionalInfo = JSON.parse(await this.callOllama(searchPrompt));
//             parsed.country = parsed.country || additionalInfo.country;
//             parsed.location = parsed.location || additionalInfo.location;
//         }

//         // Format consistently
//         let formatPrompt;
//         try {
//              formatPrompt = this.generatePrompt(Action.FORMAT, JSON.stringify(parsed));
//         } catch (error) {
//             console.log(error)
//             throw new Error(error);

//         }
//         const formatted = await this.callOllama(formatPrompt);

//         // Validate
//         const validatePrompt = this.generatePrompt(Action.VALIDATE, formatted);
//         const validation = JSON.parse(await this.callOllama(validatePrompt));

//         return {
//             formatted: formatted.trim(),
//             port_name: parsed.port_name,
//             location: parsed.location,
//             country: parsed.country,
//             valid: validation.valid
//         };
//     }

//     // async processFile(file: Express.Multer.File): Promise<PortEntry[]> {
//     //     const results : PortEntry[] = [];
//     //     const parser= fs.createReadStream(file.buffer).pipe(csv.parse({columns: false}))
//     //     parser.on('data', async(row)=> {
//     //         const result = await this.processEntry(row[0]);
//     //         results.push(result);
//     //     })

//     //     await finished(parser);
//     //     return results
//     // }

//     async processFile(file: Express.Multer.File): Promise<PortEntry[]> {
//         return new Promise((resolve, reject) => {
//             const results: PortEntry[] = [];
//             const stream = Readable.from(file.buffer);

//             const parser = stream.pipe(csv.parse({
//                 delimiter: ',',
//                 skipEmptyLines: true
//             }));

//             const processRows = async () => {
//                 for await (const row of parser) {
//                     try {
//                         const result = await this.processEntry(row[0]);
//                         results.push(result);
//                     } catch (err) {
//                         console.error('Error processing row:', err);
//                     }
//                 }
//                 return results;
//             };

//             processRows()
//                 .then(resolve)
//                 .catch(reject);
//         });
//     }
// }



import { Inject, Injectable } from '@nestjs/common';
import { OllamaConfig, OLLAMA_CONFIG } from '../config/ollama.config';
import axios from 'axios';
import * as csv from 'csv-parse';
import { PortEntry } from '../types/port.types';
import { Readable } from 'stream';

@Injectable()
export class PortProcessorService {
    constructor(
        @Inject(OLLAMA_CONFIG)
        private readonly ollamaConfig: OllamaConfig
    ) { }

    private generatePrompt(action: Action, content: string): string {
        const prompts: Record<Action, string> = {
            [Action.PARSE]: `Return a single line JSON object for this port: ${content.trim()}
{"port_name":"<name>","location":"<location>","country":"<country>"}`,

            [Action.SEARCH]: `Return a single line JSON object for port: ${content.trim()}
{"country":"<country>","location":"<location>"}`,

            [Action.FORMAT]: `Format this data: ${content.trim()}
Return only: <name> (<location>), <country>
If no location, return: <name>, <country>`,

            [Action.VALIDATE]: `Validate this entry: ${content.trim()}
Return a single line JSON:
{"valid":true/false,"reason":"<reason>"}`,
        };
        return prompts[action];
    }

    private async callOllama(prompt: string): Promise<string> {
        try {
            const response = await axios.post(this.ollamaConfig.url, {
                model: this.ollamaConfig.model,
                prompt,
                stream: false
            });
            // Clean the response to ensure valid JSON
            let cleanResponse = response.data.response
                .trim()
                .replace(/\n/g, '')
                .replace(/\r/g, '');

            // For FORMAT action, return as-is
            if (prompt.includes('Return only:')) {
                return cleanResponse;
            }

            // Test if response is valid JSON
            JSON.parse(cleanResponse);
            return cleanResponse;
        } catch {
            return '{}';
        }
    }

    async processEntry(entry: string): Promise<PortEntry> {
        try {
            // Parse base info
            const parseResult = await this.callOllama(this.generatePrompt(Action.PARSE, entry));
            const parsed = JSON.parse(parseResult);

            // Format the entry
            const formatted = await this.callOllama(this.generatePrompt(Action.FORMAT, JSON.stringify(parsed)));

            // Validate the formatted result
            const validateResult = await this.callOllama(this.generatePrompt(Action.VALIDATE, formatted));
            const validation = JSON.parse(validateResult);

            return {
                formatted: formatted || '',
                port_name: parsed.port_name || '',
                location: parsed.location || '',
                country: parsed.country || '',
                valid: validation.valid || false
            };
        } catch (error) {
            return {
                formatted: '',
                port_name: '',
                location: '',
                country: '',
                valid: false
            };
        }
    }

    async processFile(file: Express.Multer.File): Promise<PortEntry[]> {
        return new Promise((resolve) => {
            const results: PortEntry[] = [];
            const stream = Readable.from(file.buffer);

            const parser = stream.pipe(csv.parse({
                skipEmptyLines: true,
                trim: true
            }));

            parser.on('data', async (row) => {
                if (row[0]) {
                    const result = await this.processEntry(row[0].trim());
                    results.push(result);
                }
            });

            parser.on('end', () => resolve(results));
            parser.on('error', () => resolve(results));
        });
    }
}