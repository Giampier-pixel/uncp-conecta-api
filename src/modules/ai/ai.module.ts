import { Global, Module } from '@nestjs/common';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { AI_PROVIDER } from './adapters/ai-provider.interface';
import { GeminiAdapter } from './adapters/gemini.adapter';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Global()
@Module({
  imports: [KnowledgeModule],
  controllers: [AiController],
  providers: [{ provide: AI_PROVIDER, useClass: GeminiAdapter }, AiService],
  exports: [AI_PROVIDER],
})
export class AiModule {}
