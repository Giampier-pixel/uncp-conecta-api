import { Injectable } from '@nestjs/common';
import { RequestStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { REQUEST_STATUS_CITIZEN_MESSAGE, REQUEST_STATUS_LABEL } from '../requests/constants/request-status.maps';

const STATUS_ORDER = Object.keys(REQUEST_STATUS_LABEL) as RequestStatus[];
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const since = new Date(Date.now() - SEVEN_DAYS_MS);

    const [total, last7Days, byCategoryRaw, byDistrictRaw, byStatusRaw, topAreasRaw, historyRows] = await Promise.all([
      this.prisma.supportRequest.count(),
      this.prisma.supportRequest.count({ where: { createdAt: { gte: since } } }),
      this.prisma.supportRequest.groupBy({ by: ['category'], _count: { _all: true }, orderBy: { _count: { category: 'desc' } } }),
      this.prisma.supportRequest.groupBy({ by: ['district'], _count: { _all: true }, orderBy: { _count: { district: 'desc' } } }),
      this.prisma.supportRequest.groupBy({ by: ['status'], _count: { _all: true }, orderBy: { _count: { status: 'desc' } } }),
      this.prisma.supportRequest.groupBy({
        by: ['assignedAreaId'],
        where: { assignedAreaId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { assignedAreaId: 'desc' } },
        take: 5,
      }),
      this.prisma.requestStatusHistory.findMany({
        select: { requestId: true, toStatus: true, createdAt: true },
        orderBy: [{ requestId: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);

    const areaIds = topAreasRaw.map((a) => a.assignedAreaId).filter((id): id is string => !!id);
    const areas = await this.prisma.facultyArea.findMany({ where: { id: { in: areaIds } }, select: { id: true, name: true } });
    const areaNameById = new Map(areas.map((a) => [a.id, a.name]));

    return {
      totals: { total, last7Days },
      byCategory: byCategoryRaw.map((c) => ({ category: c.category, count: c._count._all })),
      byDistrict: byDistrictRaw.map((d) => ({ district: d.district, count: d._count._all })),
      byStatus: byStatusRaw.map((s) => ({
        status: s.status,
        statusLabel: REQUEST_STATUS_CITIZEN_MESSAGE[s.status],
        count: s._count._all,
      })),
      topAreas: topAreasRaw.map((a) => ({
        areaId: a.assignedAreaId,
        areaName: areaNameById.get(a.assignedAreaId as string) ?? '—',
        count: a._count._all,
      })),
      avgTimePerStage: this.computeAvgTimePerStage(historyRows),
    };
  }

  private computeAvgTimePerStage(rows: { requestId: string; toStatus: RequestStatus; createdAt: Date }[]) {
    const buckets = new Map<RequestStatus, { sumMs: number; samples: number }>();

    let i = 0;
    while (i < rows.length) {
      let j = i;
      while (j + 1 < rows.length && rows[j + 1].requestId === rows[i].requestId) j++;
      for (let k = i; k < j; k++) {
        const status = rows[k].toStatus;
        const elapsed = rows[k + 1].createdAt.getTime() - rows[k].createdAt.getTime();
        if (elapsed >= 0) {
          const bucket = buckets.get(status) ?? { sumMs: 0, samples: 0 };
          bucket.sumMs += elapsed;
          bucket.samples += 1;
          buckets.set(status, bucket);
        }
      }
      i = j + 1;
    }

    return STATUS_ORDER.filter((status) => buckets.has(status)).map((status) => {
      const { sumMs, samples } = buckets.get(status)!;
      return { status, avgHours: Math.round((sumMs / samples / 3_600_000) * 10) / 10, samples };
    });
  }
}
