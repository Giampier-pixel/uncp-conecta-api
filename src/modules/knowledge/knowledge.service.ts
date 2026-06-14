import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AI_PROVIDER, AiNotConfiguredError, AiProvider } from '../ai/adapters/ai-provider.interface';
import { chunkContent } from './chunking';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AI_PROVIDER) private readonly ai: AiProvider,
  ) {}

  async createDocument(dto: CreateDocumentDto) {
    if (!this.ai.isConfigured()) {
      throw new ServiceUnavailableException(
        'El servicio de IA (Gemini) no está configurado; define GEMINI_API_KEY para cargar documentos.',
      );
    }

    const chunks = chunkContent(dto.content);
    if (chunks.length === 0) {
      throw new BadRequestException({ statusCode: 400, message: ['El contenido no contiene texto utilizable'], error: 'Bad Request' });
    }

    let embeddings: number[][];
    try {
      embeddings = await this.ai.embed(chunks);
    } catch (error) {
      if (error instanceof AiNotConfiguredError) {
        throw new ServiceUnavailableException('El servicio de IA (Gemini) no está configurado.');
      }
      this.logger.error(`Fallo al generar embeddings: ${String(error)}`);
      throw new BadGatewayException('No se pudo procesar el documento; inténtalo de nuevo');
    }

    const document = await this.prisma.$transaction(async (tx) => {
      const doc = await tx.knowledgeDocument.create({
        data: { title: dto.title, sourceType: dto.sourceType, content: dto.content, tags: dto.tags },
        select: { id: true, title: true, sourceType: true, tags: true, createdAt: true },
      });
      for (let i = 0; i < chunks.length; i++) {
        const literal = `[${embeddings[i].join(',')}]`;
        await tx.$executeRaw`
          INSERT INTO knowledge_chunks (id, document_id, chunk_index, content, embedding, created_at)
          VALUES (${randomUUID()}::uuid, ${doc.id}::uuid, ${i}, ${chunks[i]}, ${literal}::vector, now())`;
      }
      return doc;
    });

    return {
      id: document.id,
      title: document.title,
      sourceType: document.sourceType,
      tags: document.tags,
      chunksCount: chunks.length,
      createdAt: document.createdAt,
    };
  }

  async list() {
    const docs = await this.prisma.knowledgeDocument.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        sourceType: true,
        tags: true,
        createdAt: true,
        _count: { select: { chunks: true } },
      },
    });
    return docs.map((d) => ({
      id: d.id,
      title: d.title,
      sourceType: d.sourceType,
      tags: d.tags,
      chunksCount: d._count.chunks,
      createdAt: d.createdAt,
    }));
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.knowledgeDocument.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Documento no encontrado');
    await this.prisma.knowledgeDocument.delete({ where: { id } });
  }
}
