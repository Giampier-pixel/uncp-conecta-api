import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { AiGenerateOptions, AiNotConfiguredError, AiProvider } from './ai-provider.interface';

const EMBEDDING_DIMENSIONS = 768;

@Injectable()
export class GeminiAdapter implements AiProvider {
  private readonly logger = new Logger(GeminiAdapter.name);
  private readonly client?: GoogleGenAI;
  private readonly embeddingModel: string;
  private readonly generationModel: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('GEMINI_API_KEY')?.trim();
    this.embeddingModel = config.get<string>('GEMINI_EMBEDDING_MODEL')?.trim() || 'text-embedding-004';
    this.generationModel = config.get<string>('GEMINI_MODEL')?.trim() || 'gemini-2.5-flash';

    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
      this.logger.log(`Gemini configurado (gen: ${this.generationModel}, embed: ${this.embeddingModel}).`);
    } else {
      this.logger.warn('GEMINI_API_KEY ausente: los endpoints de IA responderán 503 hasta configurarla.');
    }
  }

  isConfigured(): boolean {
    return !!this.client;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (!this.client) throw new AiNotConfiguredError();
    const response = await this.client.models.embedContent({
      model: this.embeddingModel,
      contents: texts,
      config: { outputDimensionality: EMBEDDING_DIMENSIONS },
    });
    const embeddings = response.embeddings ?? [];
    if (embeddings.length !== texts.length) {
      throw new Error(`Embeddings recibidos (${embeddings.length}) ≠ solicitados (${texts.length})`);
    }
    return embeddings.map((embedding) => {
      if (!embedding.values || embedding.values.length === 0) {
        throw new Error('El proveedor devolvió un embedding vacío');
      }
      return embedding.values;
    });
  }

  async generateStructured<T>(prompt: string, options?: AiGenerateOptions): Promise<T> {
    if (!this.client) throw new AiNotConfiguredError();
    const response = await this.client.models.generateContent({
      model: this.generationModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        ...(options?.temperature != null && { temperature: options.temperature }),
      },
    });
    const text = response.text;
    if (!text) throw new Error('El proveedor devolvió una respuesta vacía');
    return JSON.parse(text) as T;
  }
}
