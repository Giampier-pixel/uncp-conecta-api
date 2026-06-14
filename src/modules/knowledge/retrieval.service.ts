import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AI_PROVIDER, AiProvider } from '../ai/adapters/ai-provider.interface';

export interface RetrievedChunk {
  documentId: string;
  title: string;
  content: string;
  distance: number;
}

@Injectable()
export class RetrievalService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AI_PROVIDER) private readonly ai: AiProvider,
  ) {}

  async search(query: string, limit: number): Promise<RetrievedChunk[]> {
    const [embedding] = await this.ai.embed([query]);
    const literal = `[${embedding.join(',')}]`;
    return this.prisma.$queryRaw<RetrievedChunk[]>(Prisma.sql`
      SELECT kc.document_id AS "documentId",
             kd.title AS "title",
             kc.content AS "content",
             (kc.embedding <=> ${literal}::vector) AS "distance"
      FROM knowledge_chunks kc
      JOIN knowledge_documents kd ON kd.id = kc.document_id
      ORDER BY kc.embedding <=> ${literal}::vector
      LIMIT ${limit}
    `);
  }
}
