import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ConvocatoriasService } from './convocatorias.service';

@ApiTags('convocatorias')
@Controller('convocatorias')
export class ConvocatoriasController {
  constructor(private readonly convocatorias: ConvocatoriasService) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get('current')
  @ApiOperation({ summary: 'Estado de la convocatoria vigente (para el banner del cliente)' })
  current() {
    return this.convocatorias.currentStatus();
  }
}
