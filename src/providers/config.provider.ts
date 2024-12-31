// import { Provider } from '@nestjs/common';
// import { OLLAMA_CONFIG, OllamaConfig, defaultOllamaConfig } from '../config/ollama.config';

// export const OllamaConfigProvider: Provider = {
//   provide: OLLAMA_CONFIG,
//   useValue: defaultOllamaConfig,
// };


import { Provider } from '@nestjs/common';
import { OLLAMA_CONFIG, OllamaConfig, defaultOllamaConfig } from '../config/ollama.config';

export const OllamaConfigProvider: Provider = {
  provide: OLLAMA_CONFIG,
  useFactory: () => {
    return {
      url: process.env.OLLAMA_URL || defaultOllamaConfig.url,
      model: process.env.OLLAMA_MODEL || defaultOllamaConfig.model,
    } as OllamaConfig;
  },
};
