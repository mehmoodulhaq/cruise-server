export interface OllamaConfig {
    url: string;
    model: string;
  }
  
  export const OLLAMA_CONFIG = 'OLLAMA_CONFIG';

  export const defaultOllamaConfig: OllamaConfig = {
    url: 'http://localhost:11434/api/generate',
    // url: 'http://192.168.1.106:11434/api/generate',
    model: 'mistral'
  };
  