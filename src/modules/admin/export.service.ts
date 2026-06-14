import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../common/types/authenticated-user';
import { AdminRequestsService } from './admin-requests.service';

type RequestDetail = Awaited<ReturnType<AdminRequestsService['detail']>>;

export interface ExportResult {
  filename: string;
  contentType: string;
  body: Buffer | string;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function csvCell(value: unknown): string {
  const text = value == null ? '' : value instanceof Date ? value.toISOString() : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

@Injectable()
export class ExportService {
  constructor(private readonly adminRequests: AdminRequestsService) {}

  async export(id: string, format: 'html' | 'csv' | 'json', user: AuthUser): Promise<ExportResult> {
    const detail = await this.adminRequests.detail(id); 
    const code = detail.request.code;
    const filename = `expediente-${code}.${format}`;

    if (format === 'json') {
      const payload = {
        exportedAt: new Date().toISOString(),
        exportedBy: user.email,
        request: detail.request,
        aiSuggestion: detail.aiSuggestion,
        replies: detail.replies,
        history: detail.history,
      };
      return { filename, contentType: 'application/json', body: JSON.stringify(payload, null, 2) };
    }

    if (format === 'csv') {
      return { filename, contentType: 'text/csv; charset=utf-8', body: this.buildCsv(detail) };
    }

    return { filename, contentType: 'text/html; charset=utf-8', body: this.buildAdminHtml(detail, user) };
  }

  private buildCsv(detail: RequestDetail): string {
    const r = detail.request;
    const columns = [
      'code', 'created_at', 'applicant_type', 'channel', 'representative_name', 'representative_dni',
      'community_name', 'district', 'category', 'support_type', 'status_actual', 'priority',
      'beneficiaries_count', 'entity_name', 'official_position',
      'history_from', 'history_to', 'history_owner', 'history_next_step', 'history_comment', 'history_changed_by', 'history_date',
    ];
    const base = [
      r.code, r.createdAt, r.applicantType, r.channel, r.representativeName, r.representativeDni,
      r.communityName, r.district, r.category, r.supportType, r.status, r.priority,
      r.beneficiariesCount, r.entityName, r.officialPosition,
    ];

    const lines = [columns.join(',')];
    const history = detail.history.length > 0 ? detail.history : [null];
    for (const h of history) {
      const row = [
        ...base,
        h?.fromStatus ?? '',
        h?.toStatus ?? '',
        h?.ownerArea ?? '',
        h?.nextStep ?? '',
        h?.comment ?? '',
        h?.changedBy?.fullName ?? '',
        h?.createdAt ?? '',
      ];
      lines.push(row.map(csvCell).join(','));
    }

    return '﻿' + lines.join('\r\n');
  }

  private buildAdminHtml(detail: RequestDetail, user: AuthUser): string {
    const r = detail.request;
    const ai = detail.aiSuggestion;
    const historyRows = detail.history
      .map(
        (h) => `<tr>
          <td>${escapeHtml(h.createdAt instanceof Date ? h.createdAt.toISOString() : h.createdAt)}</td>
          <td>${escapeHtml(h.fromStatus ?? '—')} → ${escapeHtml(h.toStatus)}</td>
          <td>${escapeHtml(h.ownerArea)}</td>
          <td>${escapeHtml(h.nextStep ?? '')}</td>
          <td>${escapeHtml(h.comment ?? '')}</td>
          <td>${escapeHtml(h.changedBy?.fullName ?? 'Sistema')}</td>
        </tr>`,
      )
      .join('');

    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
      body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #1a1a1a; }
      h1 { font-size: 15pt; color: #7a0019; margin: 0 0 2px; }
      .sub { color: #555; font-size: 10pt; margin-bottom: 16px; }
      h2 { font-size: 12pt; border-bottom: 1px solid #7a0019; padding-bottom: 3px; margin: 18px 0 8px; }
      table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
      td, th { border: 1px solid #ccc; padding: 4px 6px; text-align: left; vertical-align: top; }
      .kv td.k { background: #f5f0f1; font-weight: bold; width: 24%; }
      .muted { color: #777; }
    </style></head><body>
      <h1>Expediente ${escapeHtml(r.code)}</h1>
      <div class="sub">UNCP Conecta — Oficina de Proyección Social · Exportado por ${escapeHtml(user.email)} el ${new Date().toLocaleString('es-PE')}</div>

      <h2>Solicitante y comunidad</h2>
      <table class="kv">
        <tr><td class="k">Representante</td><td>${escapeHtml(r.representativeName)} (DNI ${escapeHtml(r.representativeDni)})</td></tr>
        <tr><td class="k">Contacto</td><td>${escapeHtml(r.contactPhone)} ${r.contactEmail ? '/ ' + escapeHtml(r.contactEmail) : ''}</td></tr>
        <tr><td class="k">Comunidad</td><td>${escapeHtml(r.communityName)} — ${escapeHtml(r.district)} (${escapeHtml(r.applicantType)})</td></tr>
        <tr><td class="k">Ubicación</td><td>${escapeHtml(r.location)}</td></tr>
        ${r.entityName ? `<tr><td class="k">Entidad</td><td>${escapeHtml(r.entityName)} — ${escapeHtml(r.officialPosition ?? '')}</td></tr>` : ''}
      </table>

      <h2>Clasificación vigente</h2>
      <table class="kv">
        <tr><td class="k">Categoría</td><td>${escapeHtml(r.category)}</td></tr>
        <tr><td class="k">Tipo de apoyo</td><td>${escapeHtml(r.supportType)}</td></tr>
        <tr><td class="k">Área sugerida</td><td>${escapeHtml(r.suggestedArea?.name ?? '—')}</td></tr>
        <tr><td class="k">Área asignada</td><td>${escapeHtml(r.assignedArea?.name ?? '—')}</td></tr>
        <tr><td class="k">Estado</td><td>${escapeHtml(r.status)} — ${escapeHtml(r.statusLabel)}</td></tr>
        <tr><td class="k">Beneficiarios</td><td>${escapeHtml(r.beneficiariesCount ?? '—')}</td></tr>
      </table>

      <h2>Sugerencia de IA</h2>
      ${
        ai
          ? `<table class="kv">
              <tr><td class="k">Categoría / Tipo</td><td>${escapeHtml(ai.category)} / ${escapeHtml(ai.supportType)}</td></tr>
              <tr><td class="k">Área sugerida</td><td>${escapeHtml(ai.suggestedArea)} (confianza ${escapeHtml(ai.confidence)})</td></tr>
              <tr><td class="k">Resumen</td><td>${escapeHtml(ai.generatedSummary)}</td></tr>
            </table>`
          : '<p class="muted">La solicitud no pasó por la orientación con IA.</p>'
      }

      <h2>Texto formal</h2>
      <p><strong>${escapeHtml(r.formalTitle ?? '')}</strong></p>
      <p>${escapeHtml(r.formalDescription)}</p>

      <h2>Historial</h2>
      <table>
        <tr><th>Fecha</th><th>Transición</th><th>Responsable</th><th>Siguiente paso</th><th>Comentario</th><th>Por</th></tr>
        ${historyRows}
      </table>
    </body></html>`;
  }
}
