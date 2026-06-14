import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { ConvocatoriasService } from './convocatorias.service';
import { CreateConvocatoriaDto } from './dto/create-convocatoria.dto';
import { UpdateConvocatoriaDto } from './dto/update-convocatoria.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/convocatorias')
export class AdminConvocatoriasController {
  constructor(private readonly convocatorias: ConvocatoriasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar convocatorias' })
  list() {
    return this.convocatorias.list();
  }

  @Post()
  @ApiOperation({ summary: 'Crear convocatoria' })
  create(@Body() dto: CreateConvocatoriaDto) {
    return this.convocatorias.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar / activar / desactivar convocatoria' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateConvocatoriaDto) {
    return this.convocatorias.update(id, dto);
  }
}
