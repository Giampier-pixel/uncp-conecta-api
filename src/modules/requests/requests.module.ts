import { Module } from '@nestjs/common';
import { ConvocatoriasModule } from '../convocatorias/convocatorias.module';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { RequestCodeService } from './request-code.service';
import { TemplateRenderService } from './pdf/template-render.service';

@Module({
  imports: [ConvocatoriasModule],
  controllers: [RequestsController],
  providers: [RequestsService, RequestCodeService, TemplateRenderService],
  exports: [TemplateRenderService],
})
export class RequestsModule {}
