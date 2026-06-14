import { Injectable, NotFoundException } from '@nestjs/common';
import { Convocatoria } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConvocatoriaDto } from './dto/create-convocatoria.dto';
import { UpdateConvocatoriaDto } from './dto/update-convocatoria.dto';

function fmt(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
}

@Injectable()
export class ConvocatoriasService {
  constructor(private readonly prisma: PrismaService) {}

  getActive(): Promise<Convocatoria | null> {
    const now = new Date();
    return this.prisma.convocatoria.findFirst({
      where: { isActive: true, opensAt: { lte: now }, closesAt: { gte: now } },
      orderBy: { closesAt: 'asc' },
    });
  }

  private getNextUpcoming(): Promise<Convocatoria | null> {
    return this.prisma.convocatoria.findFirst({
      where: { isActive: true, opensAt: { gt: new Date() } },
      orderBy: { opensAt: 'asc' },
    });
  }

  async currentStatus() {
    const active = await this.getActive();
    if (active) {
      return {
        status: 'abierta' as const,
        current: { id: active.id, name: active.name, opensAt: active.opensAt, closesAt: active.closesAt },
        nextOpensAt: null,
        message: `Convocatoria abierta hasta el ${fmt(active.closesAt)}.`,
      };
    }
    const next = await this.getNextUpcoming();
    return {
      status: 'cerrada' as const,
      current: null,
      nextOpensAt: next?.opensAt ?? null,
      message: next
        ? `Convocatoria cerrada. Próxima apertura: ${fmt(next.opensAt)}.`
        : 'No hay convocatoria abierta en este momento.',
    };
  }

  list(): Promise<Convocatoria[]> {
    return this.prisma.convocatoria.findMany({ orderBy: { opensAt: 'desc' } });
  }

  create(dto: CreateConvocatoriaDto): Promise<Convocatoria> {
    return this.prisma.convocatoria.create({
      data: { name: dto.name, opensAt: dto.opensAt, closesAt: dto.closesAt, isActive: dto.isActive },
    });
  }

  async update(id: string, dto: UpdateConvocatoriaDto): Promise<Convocatoria> {
    const existing = await this.prisma.convocatoria.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Convocatoria no encontrada');
    return this.prisma.convocatoria.update({
      where: { id },
      data: { name: dto.name, opensAt: dto.opensAt, closesAt: dto.closesAt, isActive: dto.isActive },
    });
  }
}
