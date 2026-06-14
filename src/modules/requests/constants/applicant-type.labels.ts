import { ApplicantType } from '@prisma/client';

export const APPLICANT_TYPE_LABEL: Record<ApplicantType, string> = {
  comunidad_campesina: 'Comunidad campesina',
  comunidad_urbana: 'Comunidad urbana',
  gobierno_local: 'Gobierno local',
  otro: 'Otro',
};
