import { Module } from '@nestjs/common';
import { RequestsModule } from '../requests/requests.module';
import { AdminTemplatesController } from './admin-templates.controller';
import { AdminRequestsController } from './admin-requests.controller';
import { AdminRequestsService } from './admin-requests.service';
import { ExportService } from './export.service';

@Module({
  imports: [RequestsModule],
  controllers: [AdminTemplatesController, AdminRequestsController],
  providers: [AdminRequestsService, ExportService],
})
export class AdminModule {}
