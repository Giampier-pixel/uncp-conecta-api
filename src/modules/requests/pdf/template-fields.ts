import { ApplicantType } from '@prisma/client';
import { APPLICANT_TYPE_LABEL } from '../constants/applicant-type.labels';

export const CANONICAL_FIELD_KEYS = [
  'fecha',
  'fecha_larga',
  'anio',
  'codigo',
  'representante',
  'representante_mayus',
  'dni',
  'telefono',
  'correo',
  'comunidad',
  'tipo_solicitante',
  'ubicacion',
  'distrito',
  'categoria',
  'tipo_apoyo',
  'area_sugerida',
  'beneficiarios',
  'titulo',
  'cuerpo',
  'entidad',
  'cargo',
  'oficio',
  'firma',
] as const;

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function formatDateDDMMYYYY(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
}

export function formatDateLarga(date: Date): string {
  return `${date.getDate()} de ${MONTHS_ES[date.getMonth()]}`;
}

export interface DocumentFieldInput {
  codigo: string;
  representante: string;
  dni?: string | null;
  telefono?: string | null;
  correo?: string | null;
  comunidad?: string | null;
  applicantType: ApplicantType;
  ubicacion?: string | null;
  distrito?: string | null;
  categoria: string;
  tipoApoyo: string;
  areaSugerida?: string | null;
  beneficiarios?: number | null;
  titulo?: string | null;
  cuerpo: string;
  entidad?: string | null;
  cargo?: string | null;
  oficio?: string | null;
  firmaDataUrl?: string | null;
  fecha?: Date | null;
}

export function buildTemplateFields(input: DocumentFieldInput): Record<string, string> {
  const fechaBase = input.fecha ?? new Date();

  const firma =
    input.firmaDataUrl && input.firmaDataUrl.trim()
      ? `<img src="${input.firmaDataUrl}" alt="Firma del solicitante" style="display:block;margin:0 auto 2px;max-height:160px;max-width:360px;object-fit:contain;" />`
      : '&nbsp;';

  const cargo = input.cargo && input.cargo.trim() ? input.cargo : 'representante de la comunidad';

  return {
    fecha: formatDateDDMMYYYY(fechaBase),
    fecha_larga: formatDateLarga(fechaBase),
    anio: String(fechaBase.getFullYear()),
    codigo: input.codigo,
    representante: input.representante,
    representante_mayus: input.representante.toUpperCase(),
    dni: input.dni ?? '',
    telefono: input.telefono ?? '',
    correo: input.correo ?? '',
    comunidad: input.comunidad?.trim()
      ? input.comunidad
      : input.distrito?.trim()
        ? input.distrito
        : 'su comunidad',
    tipo_solicitante: APPLICANT_TYPE_LABEL[input.applicantType],
    ubicacion: input.ubicacion ?? '',
    distrito: input.distrito ?? '',
    categoria: input.categoria,
    tipo_apoyo: input.tipoApoyo,
    area_sugerida: input.areaSugerida ?? '',
    beneficiarios: input.beneficiarios != null ? String(input.beneficiarios) : '',
    titulo: input.titulo ?? '',
    cuerpo: input.cuerpo,
    entidad: input.entidad ?? '',
    cargo,
    oficio: input.oficio ?? '',
    firma,
  };
}
