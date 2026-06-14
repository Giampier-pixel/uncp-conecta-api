import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RequestStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/types/authenticated-user';
import { TemplateRenderService } from '../requests/pdf/template-render.service';
import { buildTemplateFields } from '../requests/pdf/template-fields';
import {
  REQUEST_STATUS_CITIZEN_MESSAGE,
  REQUEST_STATUS_NEXT_STEP,
  REQUEST_STATUS_TRANSITIONS,
  TERMINAL_STATUSES,
  resolveOwnerArea,
} from '../requests/constants/request-status.maps';
import { ListRequestsQueryDto } from './dto/list-requests.query';
import { UpdateClassificationDto } from './dto/update-classification.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

const AREA_SELECT = { select: { id: true, slug: true, name: true } } as const;
const AREA_INACTIVE_ERROR = {
  statusCode: 400,
  message: ['El área indicada no existe o no está activa'],
  error: 'Bad Request',
};

@Injectable()
export class AdminRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templateRender: TemplateRenderService,
  ) {}

  async buildRequestDocumentHtml(id: string): Promise<string> {
    const r = await this.prisma.supportRequest.findUnique({
      where: { id },
      include: { suggestedArea: { select: { name: true } } },
    });
    if (!r) throw new NotFoundException('Solicitud no encontrada');
    const fields = buildTemplateFields({
      codigo: r.code,
      representante: r.representativeName,
      dni: r.representativeDni,
      telefono: r.contactPhone,
      correo: r.contactEmail,
      comunidad: r.communityName,
      applicantType: r.applicantType,
      ubicacion: r.location,
      distrito: r.district,
      categoria: r.category,
      tipoApoyo: r.supportType,
      areaSugerida: r.suggestedArea?.name,
      beneficiarios: r.beneficiariesCount,
      titulo: r.formalTitle,
      cuerpo: r.formalDescription,
      entidad: r.entityName,
      cargo: r.officialPosition,
      oficio: r.attachedDocumentName,
      firmaDataUrl: r.signatureImage,
      fecha: r.createdAt,
    });
    return this.templateRender.renderDocument(r.applicantType, fields);
  }

  async list(query: ListRequestsQueryDto) {
    const where: Prisma.SupportRequestWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.applicantType && { applicantType: query.applicantType }),
      ...(query.category && { category: { equals: query.category, mode: 'insensitive' } }),
      ...(query.district && { district: { equals: query.district, mode: 'insensitive' } }),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.supportRequest.count({ where }),
      this.prisma.supportRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          code: true,
          createdAt: true,
          communityName: true,
          district: true,
          category: true,
          supportType: true,
          applicantType: true,
          channel: true,
          priority: true,
          status: true,
          history: { orderBy: { createdAt: 'desc' }, take: 1, select: { ownerArea: true } },
        },
      }),
    ]);

    const data = rows.map(({ history, ...r }) => ({
      ...r,
      statusLabel: REQUEST_STATUS_CITIZEN_MESSAGE[r.status],
      currentOwner: history[0]?.ownerArea ?? null,
    }));

    return {
      data,
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async detail(id: string) {
    const r = await this.prisma.supportRequest.findUnique({
      where: { id },
      include: {
        community: { select: { id: true, name: true, type: true, district: true } },
        suggestedArea: AREA_SELECT,
        assignedArea: AREA_SELECT,
        aiClassification: true,
        replies: { orderBy: { createdAt: 'asc' } },
        history: {
          orderBy: { createdAt: 'asc' },
          include: { changedBy: { select: { id: true, fullName: true } } },
        },
      },
    });
    if (!r) throw new NotFoundException('Solicitud no encontrada');

    return {
      request: {
        id: r.id,
        code: r.code,
        applicantType: r.applicantType,
        channel: r.channel,
        representativeName: r.representativeName,
        representativeDni: r.representativeDni,
        contactPhone: r.contactPhone,
        contactEmail: r.contactEmail,
        communityName: r.communityName,
        location: r.location,
        district: r.district,
        community: r.community,
        rawDescription: r.rawDescription,
        formalTitle: r.formalTitle,
        formalDescription: r.formalDescription,
        category: r.category,
        supportType: r.supportType,
        suggestedArea: r.suggestedArea,
        assignedArea: r.assignedArea,
        beneficiariesCount: r.beneficiariesCount,
        priority: r.priority,
        status: r.status,
        statusLabel: REQUEST_STATUS_CITIZEN_MESSAGE[r.status],
        entityName: r.entityName,
        officialPosition: r.officialPosition,
        attachedDocumentName: r.attachedDocumentName,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      },
      aiSuggestion: r.aiClassification
        ? {
            category: r.aiClassification.category,
            supportType: r.aiClassification.supportType,
            suggestedArea: r.aiClassification.suggestedArea,
            confidence: Number(r.aiClassification.confidence),
            missingFields: r.aiClassification.missingFields,
            reasoningSummary: r.aiClassification.reasoningSummary,
            generatedSummary: r.aiClassification.generatedSummary,
            createdAt: r.aiClassification.createdAt,
          }
        : null,
      replies: r.replies.map((reply) => ({ id: reply.id, message: reply.message, createdAt: reply.createdAt })),
      history: r.history.map((h) => ({
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        statusLabel: REQUEST_STATUS_CITIZEN_MESSAGE[h.toStatus],
        ownerArea: h.ownerArea,
        nextStep: h.nextStep,
        comment: h.comment,
        changedBy: h.changedBy ? { id: h.changedBy.id, fullName: h.changedBy.fullName } : null,
        createdAt: h.createdAt,
      })),
    };
  }

  async updateClassification(id: string, dto: UpdateClassificationDto, user: AuthUser) {
    const request = await this.prisma.supportRequest.findUnique({
      where: { id },
      select: {
        status: true,
        category: true,
        supportType: true,
        suggestedAreaId: true,
        suggestedArea: { select: { name: true } },
        history: { orderBy: { createdAt: 'desc' }, take: 1, select: { ownerArea: true } },
      },
    });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    if (TERMINAL_STATUSES.includes(request.status)) {
      throw new ConflictException('La solicitud ya está cerrada; no admite correcciones');
    }

    let newAreaName: string | null = null;
    if (dto.suggestedAreaId !== undefined) {
      const area = await this.prisma.facultyArea.findFirst({
        where: { id: dto.suggestedAreaId, isActive: true },
        select: { name: true },
      });
      if (!area) throw new BadRequestException(AREA_INACTIVE_ERROR);
      newAreaName = area.name;
    }

    const changes: string[] = [];
    if (dto.category !== undefined && dto.category !== request.category) {
      changes.push(`categoría: ${request.category} → ${dto.category}`);
    }
    if (dto.supportType !== undefined && dto.supportType !== request.supportType) {
      changes.push(`tipo de apoyo: ${request.supportType} → ${dto.supportType}`);
    }
    if (dto.suggestedAreaId !== undefined && dto.suggestedAreaId !== request.suggestedAreaId) {
      changes.push(`área sugerida: ${request.suggestedArea?.name ?? '—'} → ${newAreaName}`);
    }

    const ownerArea = request.history[0]?.ownerArea ?? resolveOwnerArea(request.status, null);

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.supportRequest.update({
        where: { id },
        data: {
          ...(dto.category !== undefined && { category: dto.category }),
          ...(dto.supportType !== undefined && { supportType: dto.supportType }),
          ...(dto.suggestedAreaId !== undefined && { suggestedAreaId: dto.suggestedAreaId }),
        },
        select: { id: true, category: true, supportType: true, suggestedArea: AREA_SELECT },
      });

      if (changes.length > 0) {
        await tx.requestStatusHistory.create({
          data: {
            requestId: id,
            fromStatus: request.status,
            toStatus: request.status,
            ownerArea,
            nextStep: null,
            comment: `Clasificación corregida: ${changes.join('; ')}`,
            changedById: user.id,
          },
        });
      }
      return u;
    });

    return {
      id: updated.id,
      category: updated.category,
      supportType: updated.supportType,
      suggestedArea: updated.suggestedArea,
    };
  }

  async updateStatus(id: string, dto: UpdateStatusDto, user: AuthUser) {
    const request = await this.prisma.supportRequest.findUnique({
      where: { id },
      select: { status: true, assignedAreaId: true, assignedArea: { select: { name: true } } },
    });
    if (!request) throw new NotFoundException('Solicitud no encontrada');

    const allowed = REQUEST_STATUS_TRANSITIONS[request.status];
    if (!allowed.includes(dto.status)) {
      const permitted = allowed.length > 0 ? allowed.join(', ') : '(ninguna, estado terminal)';
      throw new ConflictException(
        `Transición no permitida: ${request.status} → ${dto.status}. Permitidas desde ${request.status}: ${permitted}`,
      );
    }

    let assignedAreaName = request.assignedArea?.name ?? null;
    let assignedAreaId = request.assignedAreaId;
    if (dto.status === RequestStatus.DERIVADA_A_FACULTAD) {
      const area = await this.prisma.facultyArea.findFirst({
        where: { id: dto.areaId, isActive: true },
        select: { id: true, name: true },
      });
      if (!area) throw new BadRequestException(AREA_INACTIVE_ERROR);
      assignedAreaId = area.id;
      assignedAreaName = area.name;
    }

    const ownerArea = resolveOwnerArea(dto.status, assignedAreaName);
    const nextStep = dto.nextStep ?? REQUEST_STATUS_NEXT_STEP[dto.status];

    const result = await this.prisma.$transaction(async (tx) => {
      const u = await tx.supportRequest.update({
        where: { id },
        data: {
          status: dto.status,
          ...(dto.status === RequestStatus.DERIVADA_A_FACULTAD && { assignedAreaId }),
        },
        select: { id: true, status: true },
      });
      await tx.requestStatusHistory.create({
        data: {
          requestId: id,
          fromStatus: request.status,
          toStatus: dto.status,
          ownerArea,
          nextStep,
          comment: dto.comment ?? null,
          changedById: user.id,
        },
      });
      return u;
    });

    return {
      id: result.id,
      status: result.status,
      statusLabel: REQUEST_STATUS_CITIZEN_MESSAGE[result.status],
      currentOwner: ownerArea,
      nextStep,
    };
  }
}
