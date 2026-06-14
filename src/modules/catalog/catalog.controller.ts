import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CatalogService } from './catalog.service';
import { ListServicesQueryDto } from './dto/list-services.query';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get('services')
  @ApiOperation({ summary: 'Catálogo público de apoyos (servicios) activos, filtrable por categoría' })
  listServices(@Query() query: ListServicesQueryDto) {
    return this.catalog.listServices(query.category);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get('faculties')
  @ApiOperation({ summary: 'Directorio público de facultades/áreas activas (fuente única de áreas)' })
  listFaculties() {
    return this.catalog.listFaculties();
  }
}
