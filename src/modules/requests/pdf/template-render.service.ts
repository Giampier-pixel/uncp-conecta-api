import { Injectable } from '@nestjs/common';
import { ApplicantType } from '@prisma/client';
import * as Handlebars from 'handlebars';
import { PrismaService } from '../../../prisma/prisma.service';

export class TemplateNotFoundError extends Error {
  constructor() {
    super('No hay plantilla de solicitud disponible');
    this.name = 'TemplateNotFoundError';
  }
}

const PLACEHOLDER_DEFAULT = '[POR COMPLETAR]';
const MARKER_REGEX = /{{\s*([\w]+)\s*}}/g;

@Injectable()
export class TemplateRenderService {
  constructor(private readonly prisma: PrismaService) {}

  async selectTemplate(applicantType: ApplicantType) {
    const specific = await this.prisma.requestTemplate.findFirst({
      where: { isActive: true, applicantType },
      orderBy: { updatedAt: 'desc' },
    });
    if (specific) return specific;

    const generic = await this.prisma.requestTemplate.findFirst({
      where: { isActive: true, applicantType: null },
      orderBy: { updatedAt: 'desc' },
    });
    if (generic) return generic;

    throw new TemplateNotFoundError();
  }

  render(content: string, fields: Record<string, string>): string {
    const data: Record<string, string> = {};
    for (const match of content.matchAll(MARKER_REGEX)) {
      const marker = match[1];
      const value = fields[marker];
      data[marker] = value != null && value.trim() !== '' ? value : PLACEHOLDER_DEFAULT;
    }
    return Handlebars.compile(content, { noEscape: false })(data);
  }

  async renderDocument(applicantType: ApplicantType, fields: Record<string, string>): Promise<string> {
    const template = await this.selectTemplate(applicantType);
    return this.render(template.content, fields);
  }
}
