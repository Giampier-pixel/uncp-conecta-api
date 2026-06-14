import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '../../common/utils/slugify';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';

const SERVICE_SELECT = {
  id: true,
  slug: true,
  name: true,
  category: true,
  description: true,
  requirements: true,
  supportTypes: true,
  isActive: true,
  facultyArea: { select: { id: true, slug: true, name: true } },
} as const;

const FACULTY_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  topics: true,
  supportTypes: true,
  contactEmail: true,
  isActive: true,
} as const;

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  listServices(category?: string) {
    return this.prisma.service.findMany({
      where: {
        isActive: true,
        facultyArea: { isActive: true },
        ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        description: true,
        requirements: true,
        supportTypes: true,
        facultyArea: { select: { id: true, slug: true, name: true } },
      },
    });
  }

  listFaculties() {
    return this.prisma.facultyArea.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        topics: true,
        supportTypes: true,
        contactEmail: true,
      },
    });
  }


  async createService(dto: CreateServiceDto) {
    await this.assertActiveArea(dto.facultyAreaId);
    const slug = await this.uniqueSlug('service', slugify(dto.name));
    return this.prisma.service.create({
      data: {
        slug,
        name: dto.name,
        category: dto.category,
        description: dto.description,
        requirements: dto.requirements,
        supportTypes: dto.supportTypes,
        facultyAreaId: dto.facultyAreaId,
      },
      select: SERVICE_SELECT,
    });
  }

  async updateService(id: string, dto: UpdateServiceDto) {
    const existing = await this.prisma.service.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Servicio no encontrado');
    if (dto.facultyAreaId) await this.assertActiveArea(dto.facultyAreaId);
    return this.prisma.service.update({
      where: { id },
      data: {
        name: dto.name,
        category: dto.category,
        description: dto.description,
        requirements: dto.requirements,
        supportTypes: dto.supportTypes,
        facultyAreaId: dto.facultyAreaId,
        isActive: dto.isActive,
      },
      select: SERVICE_SELECT,
    });
  }

  async createFaculty(dto: CreateFacultyDto) {
    const slug = await this.uniqueSlug('faculty', slugify(dto.name));
    return this.prisma.facultyArea.create({
      data: {
        slug,
        name: dto.name,
        description: dto.description,
        topics: dto.topics,
        supportTypes: dto.supportTypes,
        contactEmail: dto.contactEmail ?? null,
      },
      select: FACULTY_SELECT,
    });
  }

  async updateFaculty(id: string, dto: UpdateFacultyDto) {
    const existing = await this.prisma.facultyArea.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Área no encontrada');
    return this.prisma.facultyArea.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        topics: dto.topics,
        supportTypes: dto.supportTypes,
        contactEmail: dto.contactEmail,
        isActive: dto.isActive,
      },
      select: FACULTY_SELECT,
    });
  }

  private async assertActiveArea(id: string) {
    const area = await this.prisma.facultyArea.findFirst({ where: { id, isActive: true }, select: { id: true } });
    if (!area) {
      throw new BadRequestException({ statusCode: 400, message: ['facultyAreaId no existe o está inactiva'], error: 'Bad Request' });
    }
  }

  private async uniqueSlug(kind: 'service' | 'faculty', base: string): Promise<string> {
    const root = base || kind;
    const taken = async (slug: string): Promise<boolean> =>
      kind === 'service'
        ? !!(await this.prisma.service.findUnique({ where: { slug }, select: { id: true } }))
        : !!(await this.prisma.facultyArea.findUnique({ where: { slug }, select: { id: true } }));

    let slug = root;
    let n = 1;
    while (await taken(slug)) {
      n += 1;
      slug = `${root}-${n}`;
    }
    return slug;
  }
}
