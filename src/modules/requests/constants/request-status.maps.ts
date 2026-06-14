import { RequestStatus } from '@prisma/client';

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  ENVIADA: 'Enviada',
  EN_REVISION: 'En revisión',
  INFORMACION_PENDIENTE: 'Información pendiente',
  DERIVADA_A_FACULTAD: 'Derivada a facultad',
  ACEPTADA_GRUPO_ABIERTO: 'Aceptada - grupo abierto',
  EN_EJECUCION: 'En ejecución',
  ATENDIDA_CONSTANCIA_EMITIDA: 'Atendida - constancia emitida',
  CERRADA: 'Cerrada',
  NO_PROCEDE: 'No procede',
};

export const REQUEST_STATUS_CITIZEN_MESSAGE: Record<RequestStatus, string> = {
  ENVIADA: 'Tu solicitud llegó a la UNCP.',
  EN_REVISION: 'Están revisando tu solicitud.',
  INFORMACION_PENDIENTE: 'Te falta enviar un dato; respóndelo aquí.',
  DERIVADA_A_FACULTAD: 'Tu solicitud fue enviada a la facultad que puede ayudarte.',
  ACEPTADA_GRUPO_ABIERTO: 'Tu trámite fue aceptado y ya se abrió un grupo de atención.',
  EN_EJECUCION: 'Se están realizando las asesorías e informes.',
  ATENDIDA_CONSTANCIA_EMITIDA: 'La atención terminó y hay constancia.',
  CERRADA: 'El caso quedó cerrado.',
  NO_PROCEDE: 'No se pudo atender, por este motivo claro.',
};

export const REQUEST_STATUS_DEFAULT_OWNER: Record<RequestStatus, string> = {
  ENVIADA: 'Oficina de Proyección Social',
  EN_REVISION: 'Oficina de Proyección Social',
  INFORMACION_PENDIENTE: 'Solicitante',
  DERIVADA_A_FACULTAD: 'Facultad / área asignada',
  ACEPTADA_GRUPO_ABIERTO: 'Facultad / área asignada',
  EN_EJECUCION: 'Facultad / área asignada',
  ATENDIDA_CONSTANCIA_EMITIDA: 'Facultad / Oficina de Proyección Social',
  CERRADA: 'Oficina de Proyección Social',
  NO_PROCEDE: 'Oficina de Proyección Social',
};

export const REQUEST_STATUS_NEXT_STEP: Record<RequestStatus, string | null> = {
  ENVIADA: 'Revisión por la Oficina de Proyección Social',
  EN_REVISION: 'Clasificación y derivación a la facultad competente',
  INFORMACION_PENDIENTE: 'El solicitante responde la observación',
  DERIVADA_A_FACULTAD: 'La facultad evaluará la apertura de un grupo de atención',
  ACEPTADA_GRUPO_ABIERTO: 'Programación de asesorías',
  EN_EJECUCION: 'Desarrollo de asesorías e informes',
  ATENDIDA_CONSTANCIA_EMITIDA: 'Cierre del caso por la Oficina de Proyección Social',
  CERRADA: null,
  NO_PROCEDE: null,
};

export const TERMINAL_STATUSES: readonly RequestStatus[] = [RequestStatus.CERRADA, RequestStatus.NO_PROCEDE];

export const REQUEST_STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  ENVIADA: [RequestStatus.EN_REVISION, RequestStatus.NO_PROCEDE],
  EN_REVISION: [RequestStatus.INFORMACION_PENDIENTE, RequestStatus.DERIVADA_A_FACULTAD, RequestStatus.NO_PROCEDE],
  INFORMACION_PENDIENTE: [RequestStatus.EN_REVISION],
  DERIVADA_A_FACULTAD: [RequestStatus.ACEPTADA_GRUPO_ABIERTO, RequestStatus.INFORMACION_PENDIENTE, RequestStatus.NO_PROCEDE],
  ACEPTADA_GRUPO_ABIERTO: [RequestStatus.EN_EJECUCION],
  EN_EJECUCION: [RequestStatus.ATENDIDA_CONSTANCIA_EMITIDA],
  ATENDIDA_CONSTANCIA_EMITIDA: [RequestStatus.CERRADA],
  CERRADA: [],
  NO_PROCEDE: [],
};

const AREA_OWNED_STATUSES: readonly RequestStatus[] = [
  RequestStatus.DERIVADA_A_FACULTAD,
  RequestStatus.ACEPTADA_GRUPO_ABIERTO,
  RequestStatus.EN_EJECUCION,
  RequestStatus.ATENDIDA_CONSTANCIA_EMITIDA,
];

export function resolveOwnerArea(status: RequestStatus, assignedAreaName: string | null): string {
  if (AREA_OWNED_STATUSES.includes(status)) {
    return assignedAreaName ?? 'Facultad / área asignada';
  }
  if (status === RequestStatus.INFORMACION_PENDIENTE) return 'Solicitante';
  return 'Oficina de Proyección Social';
}
