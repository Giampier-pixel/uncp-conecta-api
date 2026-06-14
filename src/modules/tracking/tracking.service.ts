import { Injectable } from '@nestjs/common';
import { RequestStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { REQUEST_STATUS_CITIZEN_MESSAGE } from '../requests/constants/request-status.maps';

@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async trackByDni(dni: string) {
    const requests = await this.prisma.supportRequest.findMany({
      where: { representativeDni: dni },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        formalTitle: true,
        category: true,
        supportType: true,
        status: true,
        createdAt: true,
        history: {
          orderBy: { createdAt: 'asc' },
          select: { toStatus: true, ownerArea: true, nextStep: true, comment: true, createdAt: true },
        },
      },
    });

    return { requests: requests.map((request) => this.toTrackingItem(request)) };
  }

  private toTrackingItem(request: {
    id: string;
    code: string;
    formalTitle: string | null;
    category: string;
    supportType: string;
    status: RequestStatus;
    createdAt: Date;
    history: { toStatus: RequestStatus; ownerArea: string; nextStep: string | null; comment: string | null; createdAt: Date }[];
  }) {
    const timeline = request.history.map((entry) => ({
      status: entry.toStatus,
      statusLabel: REQUEST_STATUS_CITIZEN_MESSAGE[entry.toStatus],
      owner: entry.ownerArea,
      nextStep: entry.nextStep,
      comment: entry.comment,
      date: entry.createdAt,
    }));

    const last = request.history.at(-1);

    return {
      id: request.id,
      code: request.code,
      title: request.formalTitle ?? `${request.category} · ${request.supportType}`,
      category: request.category,
      supportType: request.supportType,
      status: request.status,
      statusLabel: REQUEST_STATUS_CITIZEN_MESSAGE[request.status],
      currentOwner: last?.ownerArea ?? null,
      lastUpdate: last?.createdAt ?? request.createdAt,
      nextStep: last?.nextStep ?? null,
      observations: last?.comment ?? null,
      pendingInfoRequest: request.status === RequestStatus.INFORMACION_PENDIENTE ? (last?.comment ?? null) : null,
      acceptedMilestoneReached: request.history.some((h) => h.toStatus === RequestStatus.ACEPTADA_GRUPO_ABIERTO),
      createdAt: request.createdAt,
      timeline,
    };
  }
}
