import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Query, Res } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/authenticated-user';
import { TemplateNotFoundError } from '../requests/pdf/template-render.service';
import { AdminRequestsService } from './admin-requests.service';
import { ExportService } from './export.service';
import { ListRequestsQueryDto } from './dto/list-requests.query';
import { UpdateClassificationDto } from './dto/update-classification.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ExportQueryDto } from './dto/export-query.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.EVALUADOR, UserRole.RESPONSABLE_FACULTAD)
@Controller('admin/requests')
export class AdminRequestsController {
  constructor(
    private readonly admin: AdminRequestsService,
    private readonly exportService: ExportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Bandeja de solicitudes con filtros combinables y paginación' })
  list(@Query() query: ListRequestsQueryDto) {
    return this.admin.list(query);
  }

  @Get(':id/document')
  @ApiOperation({ summary: 'Ver la solicitud como documento HTML (con su código real)' })
  async document(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response): Promise<void> {
    let html: string;
    try {
      html = await this.admin.buildRequestDocumentHtml(id);
    } catch (error) {
      if (error instanceof TemplateNotFoundError) {
        throw new NotFoundException('No hay plantilla de solicitud disponible');
      }
      throw error;
    }
    res.set({ 'Content-Type': 'text/html; charset=utf-8' });
    res.send(html);
  }

  @Get(':id/export')
  @Roles(UserRole.ADMIN, UserRole.EVALUADOR)
  @ApiOperation({ summary: 'Exportar el expediente completo (html | csv | json)' })
  async export(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ExportQueryDto,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ): Promise<void> {
    const { filename, contentType, body } = await this.exportService.export(id, query.format, user);
    res.set({ 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${filename}"` });
    res.send(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de la solicitud (sugerencia IA separada, respuestas e historial)' })
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.detail(id);
  }

  @Patch(':id/classification')
  @Roles(UserRole.ADMIN, UserRole.EVALUADOR)
  @ApiOperation({ summary: 'Corregir la clasificación vigente (la sugerencia IA original se conserva)' })
  updateClassification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClassificationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.admin.updateClassification(id, dto, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cambiar el estado con responsable visible (matriz de transiciones)' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.admin.updateStatus(id, dto, user);
  }
}
