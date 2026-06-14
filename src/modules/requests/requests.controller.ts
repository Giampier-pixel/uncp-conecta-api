import { Body, Controller, HttpCode, NotFoundException, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { RequestsService } from './requests.service';
import { TemplateNotFoundError } from './pdf/template-render.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { PreviewDto } from './dto/preview.dto';
import { ReplyRequestDto } from './dto/reply-request.dto';

@ApiTags('requests')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  @ApiOperation({ summary: 'Crear y enviar una solicitud de apoyo (seguimiento posterior por DNI)' })
  create(@Body() dto: CreateRequestDto) {
    return this.requests.create(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('preview')
  @HttpCode(200)
  @ApiOperation({ summary: 'Documento de la solicitud en HTML imprimible (el cliente lo convierte a PDF)' })
  async preview(@Body() dto: PreviewDto, @Res() res: Response): Promise<void> {
    let html: string;
    try {
      html = await this.requests.buildPreviewHtml(dto);
    } catch (error) {
      if (error instanceof TemplateNotFoundError) {
        throw new NotFoundException('No hay plantilla de solicitud disponible');
      }
      throw error;
    }
    res.set({ 'Content-Type': 'text/html; charset=utf-8' });
    res.send(html);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reply')
  @ApiOperation({ summary: 'Responder información pendiente de una solicitud (verificación por DNI)' })
  reply(@Body() dto: ReplyRequestDto) {
    return this.requests.reply(dto);
  }
}
