
export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface AiGenerateOptions {
  temperature?: number;
}

export interface AiProvider {
  isConfigured(): boolean;
  embed(texts: string[]): Promise<number[][]>;
  generateStructured<T>(prompt: string, options?: AiGenerateOptions): Promise<T>;
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super('El servicio de IA no está configurado');
    this.name = 'AiNotConfiguredError';
  }
}
