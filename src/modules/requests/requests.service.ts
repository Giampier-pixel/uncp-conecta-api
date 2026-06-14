import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RequestStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { withTimeout } from '../../common/utils/with-timeout';
import { AI_PROVIDER, AiProvider } from '../ai/adapters/ai-provider.interface';
import { ConvocatoriasService } from '../convocatorias/convocatorias.service';
import { RequestCodeService } from './request-code.service';
import { TemplateRenderService } from './pdf/template-render.service';
import { buildTemplateFields } from './pdf/template-fields';
import {
  REQUEST_STATUS_DEFAULT_OWNER,
  REQUEST_STATUS_NEXT_STEP,
} from './constants/request-status.maps';
import { CreateRequestDto } from './dto/create-request.dto';
import { PreviewDto } from './dto/preview.dto';
import { ReplyRequestDto } from './dto/reply-request.dto';

const PANEL_SUMMARY_TIMEOUT_MS = 8_000;

const CITIZEN_CONFIRMATION =
  'Tu solicitud fue enviada a la UNCP. Puedes consultar su avance en cualquier momento con tu DNI.';

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly requestCode: RequestCodeService,
    private readonly templateRender: TemplateRenderService,
    private readonly convocatorias: ConvocatoriasService,
    @Inject(AI_PROVIDER) private readonly ai: AiProvider,
  ) {}

  async create(dto: CreateRequestDto) {
    const convocatoria = await this.convocatorias.getActive();
    if (!convocatoria) {
      const { nextOpensAt } = await this.convocatorias.currentStatus();
      const next = nextOpensAt ? new Date(nextOpensAt).toLocaleDateString('es-PE') : 'por anunciar';
      throw new ConflictException(
        `La convocatoria está cerrada. Próxima apertura: ${next}. Puedes preparar tu solicitud y enviarla cuando abra.`,
      );
    }

    await this.assertAreasExist(dto.suggestedAreaId, dto.aiClassification?.suggestedAreaId);

    const generatedSummary = dto.aiClassification ? await this.buildPanelSummary(dto) : null;

    const request = await this.prisma.$transaction(async (tx) => {
      let communityId: string | null = null;
      if (dto.communityName && dto.communityName.trim()) {
        const community = await tx.community.upsert({
          where: {
            name_type_district: {
              name: dto.communityName,
              type: dto.applicantType,
              district: dto.district,
            },
          },
          update: {},
          create: { name: dto.communityName, type: dto.applicantType, district: dto.district },
        });
        communityId = community.id;
      }

      const code = await this.requestCode.next(tx);

      return tx.supportRequest.create({
        data: {
          code,
          applicantType: dto.applicantType,
          channel: dto.channel,
          representativeName: dto.representativeName,
          representativeDni: dto.representativeDni,
          contactPhone: dto.contactPhone,
          contactEmail: dto.contactEmail ?? null,
          communityId,
          communityName: dto.communityName ?? '',
          location: dto.location,
          district: dto.district,
          rawDescription: dto.rawDescription,
          formalTitle: dto.formalTitle ?? null,
          formalDescription: dto.formalDescription,
          category: dto.category,
          supportType: dto.supportType,
          suggestedAreaId: dto.suggestedAreaId ?? null,
          beneficiariesCount: dto.beneficiariesCount ?? null,
          entityName: dto.entityName ?? null,
          officialPosition: dto.officialPosition ?? null,
          attachedDocumentName: dto.attachedDocumentName ?? null,
          signatureImage: dto.signatureImage ?? null,
          history: {
            create: {
              fromStatus: null,
              toStatus: RequestStatus.ENVIADA,
              ownerArea: REQUEST_STATUS_DEFAULT_OWNER.ENVIADA,
              nextStep: REQUEST_STATUS_NEXT_STEP.ENVIADA,
              changedById: null,
            },
          },
          ...(dto.aiClassification && {
            aiClassification: {
              create: {
                category: dto.aiClassification.category,
                supportType: dto.aiClassification.supportType,
                suggestedArea: dto.aiClassification.suggestedArea,
                suggestedAreaId: dto.aiClassification.suggestedAreaId ?? null,
                confidence: dto.aiClassification.confidence,
                missingFields: dto.aiClassification.missingFields,
                reasoningSummary: dto.aiClassification.reasoningSummary,
                generatedSummary: generatedSummary as string,
              },
            },
          }),
        },
        select: { id: true, code: true, status: true, createdAt: true },
      });
    });

    return {
      id: request.id,
      code: request.code,
      status: request.status,
      message: CITIZEN_CONFIRMATION,
      createdAt: request.createdAt,
    };
  }

  async buildPreviewHtml(dto: PreviewDto): Promise<string> {
    const fields = buildTemplateFields({
      codigo: dto.codigo ?? 'BORRADOR',
      representante: dto.representativeName,
      dni: dto.representativeDni,
      telefono: dto.contactPhone,
      correo: dto.contactEmail,
      comunidad: dto.communityName,
      applicantType: dto.applicantType,
      ubicacion: dto.location,
      distrito: dto.district,
      categoria: dto.category,
      tipoApoyo: dto.supportType,
      areaSugerida: dto.suggestedAreaName,
      beneficiarios: dto.beneficiariesCount,
      titulo: dto.formalTitle,
      cuerpo: dto.formalDescription,
      entidad: dto.entityName,
      cargo: dto.officialPosition,
      oficio: dto.attachedDocumentName,
      firmaDataUrl: dto.signatureImage,
    });
    return this.templateRender.renderDocument(dto.applicantType, fields);
  }

  async reply(dto: ReplyRequestDto) {
    const request = await this.prisma.supportRequest.findUnique({
      where: { id: dto.requestId },
      select: { id: true, status: true, representativeDni: true },
    });
    if (!request || request.representativeDni !== dto.dni) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    if (request.status !== RequestStatus.INFORMACION_PENDIENTE) {
      throw new ConflictException('Esta solicitud no tiene información pendiente por responder');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.requestReply.create({ data: { requestId: request.id, message: dto.message } });
      await tx.supportRequest.update({ where: { id: request.id }, data: { status: RequestStatus.EN_REVISION } });
      await tx.requestStatusHistory.create({
        data: {
          requestId: request.id,
          fromStatus: RequestStatus.INFORMACION_PENDIENTE,
          toStatus: RequestStatus.EN_REVISION,
          ownerArea: REQUEST_STATUS_DEFAULT_OWNER.EN_REVISION,
          nextStep: REQUEST_STATUS_NEXT_STEP.EN_REVISION,
          comment: 'El solicitante respondió la observación',
          changedById: null, 
        },
      });
    });

    return {
      requestId: request.id,
      status: RequestStatus.EN_REVISION,
      message: 'Recibimos tu respuesta. Tu solicitud volvió a revisión.',
    };
  }

  private async assertAreasExist(...maybeIds: (string | undefined)[]) {
    const areaIds = [...new Set(maybeIds.filter((id): id is string => !!id))];
    if (areaIds.length === 0) return;
    const count = await this.prisma.facultyArea.count({ where: { id: { in: areaIds }, isActive: true } });
    if (count !== areaIds.length) {
      throw new BadRequestException({
        statusCode: 400,
        message: ['El área sugerida no existe o no está activa'],
        error: 'Bad Request',
      });
    }
  }

  private async buildPanelSummary(dto: CreateRequestDto): Promise<string> {
    if (!this.ai.isConfigured()) return this.backupSummary(dto);
    try {
      const prompt = `Resume en 1-2 frases, en español claro, la siguiente solicitud de apoyo para un panel institucional. No inventes datos.
Categoría: ${dto.category}
Tipo de apoyo: ${dto.supportType}
Comunidad: ${dto.communityName} (${dto.district})
Necesidad: ${dto.rawDescription}
Devuelve ÚNICAMENTE un JSON: {"summary": "..."}`;
      const out = await withTimeout(
        this.ai.generateStructured<{ summary?: string }>(prompt, { temperature: 0.2 }),
        PANEL_SUMMARY_TIMEOUT_MS,
      );
      const summary = out?.summary?.trim();
      return summary && summary.length > 0 ? summary : this.backupSummary(dto);
    } catch (error) {
      this.logger.warn(`Resumen IA no disponible, se usa respaldo: ${String(error)}`);
      return this.backupSummary(dto);
    }
  }

  private backupSummary(dto: CreateRequestDto): string {
    const head = `${dto.category} · ${dto.supportType} · ${dto.communityName}, ${dto.district}`;
    return `${head} — ${dto.rawDescription.slice(0, 200)}`;
  }
}
