import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { AiService } from './ai.service';
import { OrientDto } from './dto/orient.dto';
import { GenerateDraftDto } from './dto/generate-draft.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('orient')
  @HttpCode(200)
  @ApiOperation({ summary: 'Orientación con IA (RAG): clasifica la necesidad y sugiere área' })
  orient(@Body() dto: OrientDto) {
    return this.ai.orient(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('generate-request-draft')
  @HttpCode(200)
  @ApiOperation({ summary: 'Redacción formal de la solicitud (devuelve campos para la plantilla)' })
  generateRequestDraft(@Body() dto: GenerateDraftDto) {
    return this.ai.generateDraft(dto);
  }
}
