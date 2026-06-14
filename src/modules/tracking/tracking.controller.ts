import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { TrackingService } from './tracking.service';
import { TrackingQueryDto } from './dto/tracking.query';

@ApiTags('tracking')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly tracking: TrackingService) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get()
  @ApiOperation({ summary: 'Seguimiento público de solicitudes por DNI (línea de tiempo ciudadana)' })
  track(@Query() query: TrackingQueryDto) {
    return this.tracking.trackByDni(query.dni);
  }
}
