import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import { withTimeout } from '../../common/utils/with-timeout';
import { CANONICAL_FIELD_KEYS } from '../requests/pdf/template-fields';
import { RetrievalService } from '../knowledge/retrieval.service';
import { AI_PROVIDER, AiProvider } from './adapters/ai-provider.interface';
import { buildOrientPrompt } from './prompts/orient.prompt';
import { buildDraftPrompt } from './prompts/draft.prompt';
import { OrientDto } from './dto/orient.dto';
import { GenerateDraftDto } from './dto/generate-draft.dto';

const AI_DOWN_MESSAGE = 'El asistente no está disponible en este momento; intenta de nuevo en unos minutos';
const PROVIDER_TIMEOUT_MS = 20_000;
const CONFIDENCE_VALIDATION_THRESHOLD = 0.4;

const OrientOutputSchema = z.object({
  summary: z.string().min(1),
  category: z.string().min(1),
  supportType: z.string().min(1),
  suggestedArea: z.string().min(1),
  confidence: z.number(),
  missingFields: z.array(z.string()).optional(),
  nextQuestion: z.string().nullable().optional(),
});

const DraftOutputSchema = z.object({
  title: z.string().min(3).max(200),
  formalText: z.string().min(100).max(8000),
  fields: z.record(z.string()).optional(),
});

/** Normaliza para comparar nombres de área (sin tildes, minúsculas). */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly retrieval: RetrievalService,
    @Inject(AI_PROVIDER) private readonly ai: AiProvider,
  ) {}

  async orient(dto: OrientDto) {
    try {
      const lastUser = [...(dto.history ?? [])].reverse().find((h) => h.role === 'user');
      const query = [dto.message, lastUser?.content].filter(Boolean).join('\n');

      const areas = await this.prisma.facultyArea.findMany({ where: { isActive: true }, select: { id: true, name: true, topics: true } });
      const chunks = await this.safeRetrieve(query, 5);

      const prompt = buildOrientPrompt({
        message: dto.message,
        location: dto.location,
        history: dto.history,
        areas: areas.map((a) => ({ name: a.name, topics: a.topics })),
        chunks,
      });

      const output = await this.generateValidated(prompt, OrientOutputSchema);

      const match = areas.find((a) => normalize(a.name) === normalize(output.suggestedArea));
      const confidence = Math.max(0, Math.min(1, output.confidence));
      const needsValidation = confidence < CONFIDENCE_VALIDATION_THRESHOLD;
      let summary = output.summary.trim();
      if (needsValidation && !/validaci[oó]n institucional/i.test(summary)) {
        summary += ' Esta orientación es preliminar y requiere validación institucional.';
      }

      const sources: { documentId: string; title: string }[] = [];
      const seen = new Set<string>();
      for (const c of chunks) {
        if (!seen.has(c.documentId)) {
          seen.add(c.documentId);
          sources.push({ documentId: c.documentId, title: c.title });
        }
      }

      return {
        summary,
        category: output.category,
        supportType: output.supportType,
        suggestedArea: output.suggestedArea,
        suggestedAreaId: match?.id ?? null,
        confidence,
        missingFields: [],
        nextQuestion: null,
        needsInstitutionalValidation: needsValidation,
        sources,
      };
    } catch (error) {
      throw this.toServiceError(error, 'orient');
    }
  }

  async generateDraft(dto: GenerateDraftDto) {
    try {
      const query = `${dto.category} ${dto.supportType} ${dto.rawDescription}`;
      const chunks = await this.safeRetrieve(query, 3);

      const prompt = buildDraftPrompt({
        rawDescription: dto.rawDescription,
        applicantType: dto.applicantType,
        communityName: dto.communityName,
        location: dto.location,
        district: dto.district,
        beneficiariesCount: dto.beneficiariesCount,
        category: dto.category,
        supportType: dto.supportType,
        representativeName: dto.representativeName,
        entityName: dto.entityName,
        officialPosition: dto.officialPosition,
        chunks,
      });

      const output = await this.generateValidated(prompt, DraftOutputSchema);

      const fields: Record<string, string> = {};
      for (const [key, value] of Object.entries(output.fields ?? {})) {
        if ((CANONICAL_FIELD_KEYS as readonly string[]).includes(key) && value && value.trim() !== '') {
          fields[key] = value.trim();
        }
      }
      fields.titulo = output.title;
      fields.cuerpo = output.formalText;

      return { title: output.title, formalText: output.formalText, fields };
    } catch (error) {
      throw this.toServiceError(error, 'generate-request-draft');
    }
  }

  private async generateValidated<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const raw = await withTimeout(this.ai.generateStructured<unknown>(prompt, { temperature: 0.2 }), PROVIDER_TIMEOUT_MS);
      const parsed = schema.safeParse(raw);
      if (parsed.success) return parsed.data;
      lastError = parsed.error;
      this.logger.warn(`Salida de IA inválida (intento ${attempt}): ${parsed.error.message}`);
    }
    throw new ServiceUnavailableException(AI_DOWN_MESSAGE);
  }

  private async safeRetrieve(query: string, k: number): Promise<Awaited<ReturnType<RetrievalService['search']>>> {
    try {
      const chunkCount = await this.prisma.knowledgeChunk.count();
      if (chunkCount === 0) return [];
      return await withTimeout(this.retrieval.search(query, k), PROVIDER_TIMEOUT_MS);
    } catch (error) {
      this.logger.warn(`Recuperación (RAG) no disponible; se continúa sin contexto: ${String(error)}`);
      return [];
    }
  }

  private toServiceError(error: unknown, op: string): Error {
    if (error instanceof ServiceUnavailableException) return error;
    this.logger.error(`Fallo de IA en ${op}: ${String(error)}`);
    return new ServiceUnavailableException(AI_DOWN_MESSAGE);
  }
}
