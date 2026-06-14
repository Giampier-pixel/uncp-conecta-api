import { Module } from '@nestjs/common';
import { ConvocatoriasController } from './convocatorias.controller';
import { AdminConvocatoriasController } from './admin-convocatorias.controller';
import { ConvocatoriasService } from './convocatorias.service';

@Module({
  controllers: [ConvocatoriasController, AdminConvocatoriasController],
  providers: [ConvocatoriasService],
  exports: [ConvocatoriasService],
})
export class ConvocatoriasModule {}
