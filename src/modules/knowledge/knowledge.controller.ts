import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { KnowledgeService } from './knowledge.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/knowledge/documents')
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Post()
  @ApiOperation({ summary: 'Cargar un documento de conocimiento (fragmenta + embebe para RAG)' })
  create(@Body() dto: CreateDocumentDto) {
    return this.knowledge.createDocument(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar documentos de conocimiento (sin contenido)' })
  list() {
    return this.knowledge.list();
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar un documento y sus chunks (sale del contexto del asistente)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.knowledge.remove(id);
  }
}
