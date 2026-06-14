import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.EVALUADOR)
@Controller('admin/templates')
export class AdminTemplatesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Plantillas oficiales disponibles para el armado de solicitudes' })
  list() {
    return this.prisma.requestTemplate.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        applicantType: true,
        placeholders: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }
}
