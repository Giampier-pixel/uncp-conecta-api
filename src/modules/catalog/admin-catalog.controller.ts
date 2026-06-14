import { Body, Controller, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CatalogService } from './catalog.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/catalog')
export class AdminCatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Post('services')
  @ApiOperation({ summary: 'Crear un servicio del catálogo' })
  createService(@Body() dto: CreateServiceDto) {
    return this.catalog.createService(dto);
  }

  @Patch('services/:id')
  @ApiOperation({ summary: 'Corregir o desactivar un servicio' })
  updateService(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateServiceDto) {
    return this.catalog.updateService(id, dto);
  }

  @Post('faculties')
  @ApiOperation({ summary: 'Crear un área/facultad' })
  createFaculty(@Body() dto: CreateFacultyDto) {
    return this.catalog.createFaculty(dto);
  }

  @Patch('faculties/:id')
  @ApiOperation({ summary: 'Corregir o desactivar un área/facultad' })
  updateFaculty(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFacultyDto) {
    return this.catalog.updateFaculty(id, dto);
  }
}
