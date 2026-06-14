import { PrismaClient, ApplicantType, RequestChannel, RequestPriority, RequestStatus, KnowledgeSourceType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'uncp2026';
const d = (iso: string) => new Date(iso);

async function nextCode(): Promise<string> {
  const rows = await prisma.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('request_code_seq') AS nextval`;
  return `UNCP${String(Number(rows[0].nextval)).padStart(5, '0')}`;
}

const AREAS = [
  { slug: 'fac-agronomia', name: 'Agronomía', description: 'Facultad de Agronomía — producción agrícola, manejo de cultivos y suelos.', topics: ['cultivos', 'plagas', 'riego', 'suelos', 'semillas'], supportTypes: ['Capacitación', 'Asesoría técnica'] },
  { slug: 'fac-zootecnia', name: 'Zootecnia', description: 'Facultad de Zootecnia — crianza de animales y producción pecuaria.', topics: ['crianza de animales', 'ganadería', 'sanidad animal', 'pastos'], supportTypes: ['Capacitación', 'Asesoría técnica'] },
  { slug: 'fac-ing-ambiental', name: 'Ingeniería Ambiental', description: 'Facultad de Ingeniería Ambiental — residuos sólidos, agua y contaminación.', topics: ['residuos sólidos', 'contaminación', 'agua', 'reciclaje'], supportTypes: ['Asesoría', 'Diagnóstico'] },
  { slug: 'fac-ing-sistemas', name: 'Ingeniería de Sistemas', description: 'Facultad de Ingeniería de Sistemas — alfabetización digital y tecnología.', topics: ['alfabetización digital', 'programación', 'tecnología', 'sistemas'], supportTypes: ['Capacitación', 'Alfabetización digital'] },
  { slug: 'fac-educacion', name: 'Educación', description: 'Facultad de Educación — alfabetización, pedagogía y refuerzo escolar.', topics: ['alfabetización', 'pedagogía', 'refuerzo escolar', 'educación'], supportTypes: ['Capacitación', 'Charlas'] },
  { slug: 'fac-administracion', name: 'Administración', description: 'Facultad de Administración — gestión, negocios y proyectos locales.', topics: ['emprendimiento', 'gestión', 'negocios', 'proyectos locales'], supportTypes: ['Asesoría', 'Capacitación'] },
  { slug: 'fac-economia', name: 'Economía', description: 'Facultad de Economía — emprendimiento, finanzas y formalización.', topics: ['emprendimiento', 'finanzas', 'mercados', 'formalización'], supportTypes: ['Asesoría', 'Capacitación'] },
  { slug: 'fac-medicina', name: 'Medicina Humana', description: 'Facultad de Medicina Humana — salud preventiva y campañas de salud.', topics: ['salud preventiva', 'campañas de salud', 'prevención'], supportTypes: ['Charlas', 'Campañas'] },
  { slug: 'fac-enfermeria', name: 'Enfermería', description: 'Facultad de Enfermería — primeros auxilios, cuidados y prevención.', topics: ['salud preventiva', 'primeros auxilios', 'cuidados'], supportTypes: ['Charlas', 'Campañas'] },
  { slug: 'fac-ing-civil', name: 'Ingeniería Civil', description: 'Facultad de Ingeniería Civil — infraestructura local y saneamiento.', topics: ['infraestructura local', 'obras', 'saneamiento'], supportTypes: ['Asesoría', 'Diagnóstico'] },
  { slug: 'fac-arquitectura', name: 'Arquitectura', description: 'Facultad de Arquitectura — diseño urbano y espacios públicos.', topics: ['infraestructura local', 'diseño urbano', 'espacios públicos'], supportTypes: ['Asesoría', 'Diagnóstico'] },
  { slug: 'fac-trabajo-social', name: 'Trabajo Social', description: 'Facultad de Trabajo Social — problemas sociales y acompañamiento comunitario.', topics: ['problemas sociales', 'familia', 'comunidad'], supportTypes: ['Diagnóstico', 'Acompañamiento'] },
  { slug: 'fac-sociologia', name: 'Sociología', description: 'Facultad de Sociología — organización comunitaria e investigación social.', topics: ['problemas sociales', 'organización comunitaria', 'investigación'], supportTypes: ['Diagnóstico', 'Investigación'] },
];

const SERVICES = [
  { slug: 'svc-capacitacion-agricola', name: 'Capacitación en manejo de cultivos', category: 'Capacitación agrícola', area: 'fac-agronomia', description: 'Talleres prácticos sobre siembra, control de plagas y manejo de cultivos andinos.', requirements: ['Grupo mínimo de 20 participantes', 'Espacio comunal para el taller'], supportTypes: ['Capacitación'] },
  { slug: 'svc-asesoria-residuos', name: 'Asesoría en manejo de residuos sólidos', category: 'Gestión ambiental', area: 'fac-ing-ambiental', description: 'Acompañamiento técnico para segregación, reciclaje y disposición de residuos.', requirements: ['Diagnóstico inicial de la zona'], supportTypes: ['Asesoría', 'Diagnóstico'] },
  { slug: 'svc-alfabetizacion-digital', name: 'Alfabetización digital', category: 'Alfabetización digital', area: 'fac-ing-sistemas', description: 'Capacitación básica en uso de computadoras, internet y trámites en línea.', requirements: ['Ambiente con energía eléctrica', 'Grupo de 15 a 30 personas'], supportTypes: ['Capacitación', 'Alfabetización digital'] },
  { slug: 'svc-salud-preventiva', name: 'Charlas de salud preventiva', category: 'Salud preventiva', area: 'fac-medicina', description: 'Charlas y campañas sobre prevención de enfermedades comunes y hábitos saludables.', requirements: ['Local comunal', 'Coordinación con autoridad local'], supportTypes: ['Charlas', 'Campañas'] },
  { slug: 'svc-proyectos-locales', name: 'Orientación de proyectos locales', category: 'Proyectos locales', area: 'fac-administracion', description: 'Orientación para formular y gestionar proyectos de desarrollo comunitario.', requirements: ['Idea de proyecto definida'], supportTypes: ['Asesoría'] },
  { slug: 'svc-diagnostico-comunitario', name: 'Diagnóstico comunitario participativo', category: 'Diagnóstico comunitario', area: 'fac-trabajo-social', description: 'Levantamiento participativo de necesidades y problemas de la comunidad.', requirements: ['Convocatoria comunal'], supportTypes: ['Diagnóstico'] },
  { slug: 'svc-emprendimiento', name: 'Apoyo a emprendimientos comunitarios', category: 'Emprendimiento', area: 'fac-economia', description: 'Asesoría en costos, formalización y comercialización para emprendimientos locales.', requirements: ['Emprendimiento en marcha o idea de negocio'], supportTypes: ['Asesoría', 'Capacitación'] },
  { slug: 'svc-programacion', name: 'Capacitación en programación básica', category: 'Capacitación en programación', area: 'fac-ing-sistemas', description: 'Introducción a la programación para jóvenes y docentes de la comunidad.', requirements: ['Laboratorio o equipos disponibles'], supportTypes: ['Capacitación'] },
  { slug: 'svc-crianza-animales', name: 'Capacitación en crianza de animales menores', category: 'Producción pecuaria', area: 'fac-zootecnia', description: 'Talleres sobre crianza, sanidad y alimentación de animales menores.', requirements: ['Grupo de criadores interesados'], supportTypes: ['Capacitación', 'Asesoría técnica'] },
];

const TEMPLATE_OFICIO = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><style>
  @page { size: A4; margin: 0; }
  body { font-family: 'Times New Roman', Georgia, serif; font-size: 12pt; color: #1a1a1a; line-height: 1.6; padding: 2cm 2.2cm; }
  .codigo { text-align: right; font-size: 9pt; color: #8a8a8a; margin-bottom: 10px; }
  .sumilla { width: 58%; margin: 0 0 30px auto; text-align: center; font-weight: bold; text-transform: uppercase; line-height: 1.4; }
  .dirigido { font-weight: bold; text-transform: uppercase; line-height: 1.4; margin-bottom: 4px; }
  .sd { font-weight: bold; margin-bottom: 24px; }
  p.parrafo { text-align: justify; text-indent: 2.5em; margin: 0 0 16px; }
  p.parrafo.sin-sangria { text-indent: 0; }
  .expuesto { font-weight: bold; margin: 20px 0 6px; }
  .fecha { text-align: right; margin: 30px 0 64px; }
  .firma-zona { text-align: center; }
  .firma-linea { border-top: 1px solid #1a1a1a; width: 60%; margin: 0 auto 6px; }
  .firma-nombre { font-weight: bold; text-transform: uppercase; }
  .firma-dni { font-size: 11pt; }
</style></head>
<body>
  <div class="sumilla">Solicito: Apoyo de Proyección Social y Extensión Universitaria</div>

  <div class="dirigido">Señor Director(a) de la Oficina General de Extensión Cultural y Proyección Social de la Universidad Nacional del Centro del Perú</div>
  <div class="sd">S.D.</div>

  <p class="parrafo">Yo, <strong>{{representante}}</strong>; identificado con DNI N° {{dni}}, en mi condición de {{cargo}} de {{comunidad}}, con domicilio legal en {{ubicacion}} y número de contacto {{telefono}}, ante usted con el debido respeto me presento y expongo:</p>

  <p class="parrafo">Que, nuestra comunidad presenta actualmente {{cuerpo}}, por lo que requerimos orientación profesional y {{tipo_apoyo}} para mejorar el bienestar de las familias locales.</p>

  <div class="expuesto">POR LO EXPUESTO:</div>
  <p class="parrafo sin-sangria">Ruego a Ud. Señor director, acceder a mi petición por ser de justicia.</p>

  <p class="fecha">{{distrito}}, {{fecha_larga}} del {{anio}}</p>

  <div class="firma-zona">
    {{{firma}}}
    <div class="firma-linea"></div>
    <div class="firma-nombre">{{representante_mayus}}</div>
    <div class="firma-dni">DNI: {{dni}}</div>
  </div>
</body></html>`;

const KNOWLEDGE = [
  { title: 'Flujograma del proceso de proyección social (placeholder)', sourceType: KnowledgeSourceType.insumo_desafio, tags: ['flujo', 'proceso'], content: 'Placeholder del flujograma oficial del proceso de proyección social de la UNCP. Se reemplazará con el insumo entregado por la universidad el día 1 del desafío.' },
  { title: 'Catálogo de servicios de proyección social por categoría', sourceType: KnowledgeSourceType.simulada, tags: ['catálogo', 'servicios'], content: 'La UNCP ofrece servicios de proyección social en categorías como capacitación agrícola, gestión ambiental, alfabetización digital, salud preventiva, emprendimiento y diagnóstico comunitario. Cada servicio es atendido por una facultad o escuela según el tema de la necesidad.' },
  { title: 'Preguntas frecuentes (FAQ) de la ventanilla digital', sourceType: KnowledgeSourceType.simulada, tags: ['faq', 'orientación'], content: 'El ciudadano puede dar seguimiento a su solicitud con su número de DNI. La UNCP no aprueba automáticamente las solicitudes: cada una es revisada y derivada a la facultad competente. La universidad no cobra por los servicios de proyección social.' },
  { title: 'Requisitos generales para solicitar apoyo', sourceType: KnowledgeSourceType.referencial, tags: ['requisitos'], content: 'Para solicitar apoyo se requiere: representante de la comunidad u organización, descripción de la necesidad, distrito y número de beneficiarios estimado. Para gobiernos locales se adjunta un oficio firmado por la autoridad.' },
];

async function upsertCommunity(name: string, type: ApplicantType, district: string) {
  return prisma.community.upsert({
    where: { name_type_district: { name, type, district } },
    update: {},
    create: { name, type, district },
  });
}

async function main() {
  console.log('🌱 Seed UNCP Conecta — datos sintéticos');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const areaBySlug = new Map<string, string>();
  for (const a of AREAS) {
    const area = await prisma.facultyArea.upsert({
      where: { slug: a.slug },
      update: { name: a.name, description: a.description, topics: a.topics, supportTypes: a.supportTypes, contactEmail: `${a.slug.replace('fac-', '')}@uncp.edu.pe` },
      create: { slug: a.slug, name: a.name, description: a.description, topics: a.topics, supportTypes: a.supportTypes, contactEmail: `${a.slug.replace('fac-', '')}@uncp.edu.pe` },
    });
    areaBySlug.set(a.slug, area.id);
  }
  console.log(`  ✔ ${AREAS.length} áreas/facultades`);

  const agronomiaId = areaBySlug.get('fac-agronomia')!;
  await prisma.user.upsert({
    where: { email: 'admin@uncp.edu.pe' },
    update: { passwordHash, fullName: 'Administrador del Sistema', role: UserRole.ADMIN, facultyAreaId: null, isActive: true },
    create: { email: 'admin@uncp.edu.pe', passwordHash, fullName: 'Administrador del Sistema', role: UserRole.ADMIN },
  });
  const evaluador = await prisma.user.upsert({
    where: { email: 'proyeccion@uncp.edu.pe' },
    update: { passwordHash, fullName: 'Oficina de Proyección Social', role: UserRole.EVALUADOR, facultyAreaId: null, isActive: true },
    create: { email: 'proyeccion@uncp.edu.pe', passwordHash, fullName: 'Oficina de Proyección Social', role: UserRole.EVALUADOR },
  });
  await prisma.user.upsert({
    where: { email: 'agronomia@uncp.edu.pe' },
    update: { passwordHash, fullName: 'Responsable Facultad de Agronomía', role: UserRole.RESPONSABLE_FACULTAD, facultyAreaId: agronomiaId, isActive: true },
    create: { email: 'agronomia@uncp.edu.pe', passwordHash, fullName: 'Responsable Facultad de Agronomía', role: UserRole.RESPONSABLE_FACULTAD, facultyAreaId: agronomiaId },
  });
  console.log('  ✔ 3 usuarios (admin / evaluador / responsable)');

  for (const s of SERVICES) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: { name: s.name, category: s.category, description: s.description, requirements: s.requirements, supportTypes: s.supportTypes, facultyAreaId: areaBySlug.get(s.area)! },
      create: { slug: s.slug, name: s.name, category: s.category, description: s.description, requirements: s.requirements, supportTypes: s.supportTypes, facultyAreaId: areaBySlug.get(s.area)! },
    });
  }
  console.log(`  ✔ ${SERVICES.length} servicios`);

  const OFICIO_PLACEHOLDERS = ['codigo', 'representante', 'representante_mayus', 'dni', 'cargo', 'comunidad', 'ubicacion', 'telefono', 'cuerpo', 'tipo_apoyo', 'distrito', 'fecha_larga', 'anio', 'firma'];
  await prisma.requestTemplate.deleteMany({});
  await prisma.requestTemplate.create({
    data: { slug: 'solicitud-oficio-uncp', name: 'Oficio de solicitud de proyección social (modelo UNCP)', applicantType: null, content: TEMPLATE_OFICIO, placeholders: OFICIO_PLACEHOLDERS },
  });
  console.log('  ✔ 1 plantilla oficial (oficio modelo UNCP)');

  await prisma.convocatoria.deleteMany({});
  const nowDate = new Date();
  await prisma.convocatoria.create({
    data: {
      name: `Convocatoria ${nowDate.getFullYear()}-${nowDate.getMonth() < 6 ? 'I' : 'II'}`,
      opensAt: new Date(nowDate.getTime() - 7 * 24 * 3600 * 1000),
      closesAt: new Date(nowDate.getTime() + 30 * 24 * 3600 * 1000),
    },
  });
  await prisma.convocatoria.create({
    data: {
      name: `Convocatoria ${nowDate.getFullYear() - 1}-II`,
      opensAt: new Date(nowDate.getFullYear() - 1, 8, 1),
      closesAt: new Date(nowDate.getFullYear() - 1, 8, 30),
    },
  });
  console.log('  ✔ 2 convocatorias (1 abierta para demo, 1 histórica)');

  for (const k of KNOWLEDGE) {
    const existing = await prisma.knowledgeDocument.findFirst({ where: { title: k.title } });
    if (existing) {
      await prisma.knowledgeDocument.update({ where: { id: existing.id }, data: { sourceType: k.sourceType, content: k.content, tags: k.tags } });
    } else {
      await prisma.knowledgeDocument.create({ data: k });
    }
  }
  console.log(`  ✔ ${KNOWLEDGE.length} documentos de base de conocimiento (sin chunks aún)`);

  await prisma.supportRequest.deleteMany({});
  await prisma.$executeRawUnsafe('ALTER SEQUENCE request_code_seq RESTART WITH 1');

  const O = 'Oficina de Proyección Social';
  const ev = evaluador.id;

  const ccAcopalca = await upsertCommunity('Comunidad Campesina de Acopalca', ApplicantType.comunidad_campesina, 'El Tambo');
  const jvSanCarlos = await upsertCommunity('Junta Vecinal San Carlos', ApplicantType.comunidad_urbana, 'Huancayo');
  const ccChongos = await upsertCommunity('Comunidad Campesina de Chongos Alto', ApplicantType.comunidad_campesina, 'Chongos Alto');
  const muniSapallanga = await upsertCommunity('Municipalidad Distrital de Sapallanga', ApplicantType.gobierno_local, 'Sapallanga');
  const asocArtesanas = await upsertCommunity('Asociación de Artesanas Manos de Junín', ApplicantType.comunidad_urbana, 'El Tambo');

  const requests = [
    {
      applicantType: ApplicantType.comunidad_campesina, channel: RequestChannel.web,
      representativeName: 'Juan Pérez Quispe', representativeDni: '40123456', contactPhone: '964111222', contactEmail: null,
      communityId: ccAcopalca.id, communityName: ccAcopalca.name, location: 'Anexo de Acopalca', district: 'El Tambo',
      rawDescription: 'En nuestra comunidad los cultivos de papa están siendo afectados por una plaga y no sabemos cómo controlarla. Queremos que nos capaciten.',
      formalTitle: 'Solicitud de capacitación en control de plagas en el cultivo de papa',
      formalDescription: 'La Comunidad Campesina de Acopalca solicita una capacitación técnica sobre el control de plagas que afectan el cultivo de papa, con el fin de proteger su producción y mejorar sus rendimientos.',
      category: 'Capacitación agrícola', supportType: 'Capacitación', suggestedAreaSlug: 'fac-agronomia', assignedAreaSlug: null,
      beneficiariesCount: 45, priority: RequestPriority.media, status: RequestStatus.ENVIADA, createdAt: '2026-06-11T14:00:00Z',
      classification: { category: 'Capacitación agrícola', supportType: 'Capacitación', suggestedArea: 'Agronomía', suggestedAreaSlug: 'fac-agronomia', confidence: 0.92, missingFields: [], reasoningSummary: 'La necesidad menciona cultivos de papa y plagas, temas propios de Agronomía.', generatedSummary: 'Comunidad de Acopalca pide capacitación para controlar plagas en el cultivo de papa (45 beneficiarios).' },
      history: [{ from: null, to: RequestStatus.ENVIADA, owner: O, nextStep: 'Tu solicitud fue recibida y será revisada por la Oficina de Proyección Social.', comment: null, by: null, at: '2026-06-11T14:00:00Z' }],
    },
    {
      applicantType: ApplicantType.comunidad_urbana, channel: RequestChannel.app_movil,
      representativeName: 'María Flores Huamán', representativeDni: '41222333', contactPhone: '987654321', contactEmail: 'jvsancarlos@example.com',
      communityId: jvSanCarlos.id, communityName: jvSanCarlos.name, location: 'Urb. San Carlos', district: 'Huancayo',
      rawDescription: 'Hay basura acumulada en varias calles de nuestro barrio y queremos aprender a manejar mejor los residuos.',
      formalTitle: 'Solicitud de asesoría para el manejo de residuos sólidos en el barrio',
      formalDescription: 'La Junta Vecinal San Carlos solicita asesoría técnica para mejorar la segregación y disposición de residuos sólidos en el barrio, ante la acumulación de basura en las calles.',
      category: 'Gestión ambiental', supportType: 'Asesoría', suggestedAreaSlug: 'fac-ing-ambiental', assignedAreaSlug: null,
      beneficiariesCount: 300, priority: RequestPriority.alta, status: RequestStatus.EN_REVISION, createdAt: '2026-06-09T09:30:00Z',
      classification: { category: 'Gestión ambiental', supportType: 'Asesoría', suggestedArea: 'Ingeniería Ambiental', suggestedAreaSlug: 'fac-ing-ambiental', confidence: 0.81, missingFields: [], reasoningSummary: 'Residuos sólidos y contaminación corresponden a Ingeniería Ambiental.', generatedSummary: 'Junta Vecinal San Carlos pide asesoría para el manejo de residuos sólidos (300 beneficiarios).' },
      history: [
        { from: null, to: RequestStatus.ENVIADA, owner: O, nextStep: 'Tu solicitud fue recibida y será revisada.', comment: null, by: null, at: '2026-06-09T09:30:00Z' },
        { from: RequestStatus.ENVIADA, to: RequestStatus.EN_REVISION, owner: O, nextStep: 'Tu solicitud está siendo revisada por la Oficina de Proyección Social.', comment: null, by: ev, at: '2026-06-10T11:00:00Z' },
      ],
    },
    {
      applicantType: ApplicantType.comunidad_campesina, channel: RequestChannel.web,
      representativeName: 'Pedro Camac Ramos', representativeDni: '42333444', contactPhone: '961222333', contactEmail: null,
      communityId: ccChongos.id, communityName: ccChongos.name, location: 'Plaza principal de Chongos Alto', district: 'Chongos Alto',
      rawDescription: 'Los jóvenes y adultos de la comunidad no saben usar computadoras ni hacer trámites por internet. Queremos aprender.',
      formalTitle: 'Solicitud de taller de alfabetización digital para la comunidad',
      formalDescription: 'La Comunidad Campesina de Chongos Alto solicita un taller de alfabetización digital dirigido a jóvenes y adultos, para el uso básico de computadoras, internet y trámites en línea.',
      category: 'Alfabetización digital', supportType: 'Capacitación', suggestedAreaSlug: 'fac-ing-sistemas', assignedAreaSlug: 'fac-ing-sistemas',
      beneficiariesCount: 60, priority: RequestPriority.media, status: RequestStatus.DERIVADA_A_FACULTAD, createdAt: '2026-06-05T08:15:00Z',
      classification: { category: 'Alfabetización digital', supportType: 'Capacitación', suggestedArea: 'Ingeniería de Sistemas', suggestedAreaSlug: 'fac-ing-sistemas', confidence: 0.88, missingFields: [], reasoningSummary: 'La alfabetización digital se atiende desde Ingeniería de Sistemas o Educación.', generatedSummary: 'Chongos Alto pide un taller de alfabetización digital para 60 personas.' },
      history: [
        { from: null, to: RequestStatus.ENVIADA, owner: O, nextStep: 'Tu solicitud fue recibida y será revisada.', comment: null, by: null, at: '2026-06-05T08:15:00Z' },
        { from: RequestStatus.ENVIADA, to: RequestStatus.EN_REVISION, owner: O, nextStep: 'Tu solicitud está siendo revisada.', comment: null, by: ev, at: '2026-06-06T10:00:00Z' },
        { from: RequestStatus.EN_REVISION, to: RequestStatus.DERIVADA_A_FACULTAD, owner: 'Facultad de Ingeniería de Sistemas', nextStep: 'Tu solicitud fue enviada a la facultad que puede ayudarte.', comment: 'Se deriva para programar el taller de alfabetización digital.', by: ev, at: '2026-06-07T16:20:00Z' },
      ],
    },
    {
      applicantType: ApplicantType.gobierno_local, channel: RequestChannel.web,
      representativeName: 'Carlos Mendoza Rojas', representativeDni: '43444555', contactPhone: '964333444', contactEmail: 'desarrollo@munisapallanga.gob.pe',
      communityId: muniSapallanga.id, communityName: 'Distrito de Sapallanga', location: 'Plaza de Armas de Sapallanga', district: 'Sapallanga',
      rawDescription: 'Como municipalidad queremos organizar campañas de salud preventiva para las familias del distrito.',
      formalTitle: 'Solicitud de campañas de salud preventiva para el distrito de Sapallanga',
      formalDescription: 'La Municipalidad Distrital de Sapallanga solicita el apoyo de la UNCP para realizar campañas de salud preventiva dirigidas a las familias del distrito, en el marco de la proyección social universitaria.',
      category: 'Salud preventiva', supportType: 'Charlas', suggestedAreaSlug: 'fac-medicina', assignedAreaSlug: 'fac-medicina',
      beneficiariesCount: 500, priority: RequestPriority.alta, status: RequestStatus.EN_EJECUCION, createdAt: '2026-05-28T10:00:00Z',
      entityName: 'Municipalidad Distrital de Sapallanga', officialPosition: 'Gerente de Desarrollo Social', attachedDocumentName: 'oficio-045-2026-MDS.pdf',
      classification: { category: 'Salud preventiva', supportType: 'Charlas', suggestedArea: 'Medicina Humana', suggestedAreaSlug: 'fac-medicina', confidence: 0.79, missingFields: [], reasoningSummary: 'Las campañas de salud preventiva corresponden a Medicina o Enfermería.', generatedSummary: 'La Municipalidad de Sapallanga solicita campañas de salud preventiva para 500 familias.' },
      history: [
        { from: null, to: RequestStatus.ENVIADA, owner: O, nextStep: 'Tu solicitud fue recibida y será revisada.', comment: null, by: null, at: '2026-05-28T10:00:00Z' },
        { from: RequestStatus.ENVIADA, to: RequestStatus.EN_REVISION, owner: O, nextStep: 'Tu solicitud está siendo revisada.', comment: null, by: ev, at: '2026-05-29T09:00:00Z' },
        { from: RequestStatus.EN_REVISION, to: RequestStatus.DERIVADA_A_FACULTAD, owner: 'Facultad de Medicina Humana', nextStep: 'Tu solicitud fue enviada a la facultad que puede ayudarte.', comment: 'Se deriva para evaluación de la campaña.', by: ev, at: '2026-05-30T15:00:00Z' },
        { from: RequestStatus.DERIVADA_A_FACULTAD, to: RequestStatus.ACEPTADA_GRUPO_ABIERTO, owner: 'Facultad de Medicina Humana', nextStep: 'Un grupo de la facultad aceptó atender tu solicitud.', comment: 'Grupo de internado médico aceptó la actividad.', by: ev, at: '2026-06-02T11:30:00Z' },
        { from: RequestStatus.ACEPTADA_GRUPO_ABIERTO, to: RequestStatus.EN_EJECUCION, owner: 'Facultad de Medicina Humana', nextStep: 'La campaña está siendo ejecutada. Fecha programada: 20/06/2026.', comment: null, by: ev, at: '2026-06-08T08:00:00Z' },
      ],
    },
    {
      applicantType: ApplicantType.comunidad_urbana, channel: RequestChannel.app_movil,
      representativeName: 'Rosa Ñahui Lazo', representativeDni: '44555666', contactPhone: '962444555', contactEmail: null,
      communityId: asocArtesanas.id, communityName: asocArtesanas.name, location: 'Mercado Modelo de El Tambo', district: 'El Tambo',
      rawDescription: 'Somos un grupo de artesanas y queremos aprender a calcular costos y formalizar nuestro negocio.',
      formalTitle: 'Solicitud de asesoría en costos y formalización para emprendimiento artesanal',
      formalDescription: 'La Asociación de Artesanas Manos de Junín solicita asesoría en cálculo de costos, formalización y comercialización para fortalecer su emprendimiento artesanal.',
      category: 'Emprendimiento', supportType: 'Asesoría', suggestedAreaSlug: 'fac-economia', assignedAreaSlug: 'fac-economia',
      beneficiariesCount: 25, priority: RequestPriority.media, status: RequestStatus.ATENDIDA_CONSTANCIA_EMITIDA, createdAt: '2026-05-15T13:00:00Z',
      classification: { category: 'Emprendimiento', supportType: 'Asesoría', suggestedArea: 'Economía', suggestedAreaSlug: 'fac-economia', confidence: 0.85, missingFields: [], reasoningSummary: 'El emprendimiento y la formalización se atienden desde Economía o Administración.', generatedSummary: 'Asociación de artesanas pide asesoría en costos y formalización (25 beneficiarias).' },
      history: [
        { from: null, to: RequestStatus.ENVIADA, owner: O, nextStep: 'Tu solicitud fue recibida y será revisada.', comment: null, by: null, at: '2026-05-15T13:00:00Z' },
        { from: RequestStatus.ENVIADA, to: RequestStatus.EN_REVISION, owner: O, nextStep: 'Tu solicitud está siendo revisada.', comment: null, by: ev, at: '2026-05-16T10:00:00Z' },
        { from: RequestStatus.EN_REVISION, to: RequestStatus.DERIVADA_A_FACULTAD, owner: 'Facultad de Economía', nextStep: 'Tu solicitud fue enviada a la facultad que puede ayudarte.', comment: 'Se deriva para asesoría especializada.', by: ev, at: '2026-05-18T14:00:00Z' },
        { from: RequestStatus.DERIVADA_A_FACULTAD, to: RequestStatus.ACEPTADA_GRUPO_ABIERTO, owner: 'Facultad de Economía', nextStep: 'Un grupo aceptó atender tu solicitud.', comment: null, by: ev, at: '2026-05-20T09:00:00Z' },
        { from: RequestStatus.ACEPTADA_GRUPO_ABIERTO, to: RequestStatus.EN_EJECUCION, owner: 'Facultad de Economía', nextStep: 'La asesoría está en ejecución.', comment: null, by: ev, at: '2026-05-25T09:00:00Z' },
        { from: RequestStatus.EN_EJECUCION, to: RequestStatus.ATENDIDA_CONSTANCIA_EMITIDA, owner: 'Facultad de Economía', nextStep: 'Tu solicitud fue atendida y se emitió la constancia de participación.', comment: 'Taller de costos y formalización concluido.', by: ev, at: '2026-06-05T17:00:00Z' },
      ],
    },
  ];

  let created = 0;
  for (const r of requests) {
    const code = await nextCode();
    await prisma.supportRequest.create({
      data: {
        code,
        applicantType: r.applicantType,
        channel: r.channel,
        representativeName: r.representativeName,
        representativeDni: r.representativeDni,
        contactPhone: r.contactPhone,
        contactEmail: r.contactEmail ?? null,
        communityId: r.communityId,
        communityName: r.communityName,
        location: r.location,
        district: r.district,
        rawDescription: r.rawDescription,
        formalTitle: r.formalTitle,
        formalDescription: r.formalDescription,
        category: r.category,
        supportType: r.supportType,
        suggestedAreaId: r.suggestedAreaSlug ? areaBySlug.get(r.suggestedAreaSlug)! : null,
        assignedAreaId: r.assignedAreaSlug ? areaBySlug.get(r.assignedAreaSlug)! : null,
        beneficiariesCount: r.beneficiariesCount,
        priority: r.priority,
        status: r.status,
        entityName: r.entityName ?? null,
        officialPosition: r.officialPosition ?? null,
        attachedDocumentName: r.attachedDocumentName ?? null,
        createdAt: d(r.createdAt),
        aiClassification: {
          create: {
            category: r.classification.category,
            supportType: r.classification.supportType,
            suggestedArea: r.classification.suggestedArea,
            suggestedAreaId: r.classification.suggestedAreaSlug ? areaBySlug.get(r.classification.suggestedAreaSlug)! : null,
            confidence: r.classification.confidence,
            missingFields: r.classification.missingFields,
            reasoningSummary: r.classification.reasoningSummary,
            generatedSummary: r.classification.generatedSummary,
            createdAt: d(r.createdAt),
          },
        },
        history: {
          create: r.history.map((h) => ({
            fromStatus: h.from,
            toStatus: h.to,
            ownerArea: h.owner,
            nextStep: h.nextStep,
            comment: h.comment,
            changedById: h.by,
            createdAt: d(h.at),
          })),
        },
      },
    });
    created++;
  }
  console.log(`  ✔ ${created} solicitudes demo (con historial y clasificación IA)`);
  console.log('Seed completado.');
  console.log(`   Credenciales demo (sintéticas): admin@uncp.edu.pe / proyeccion@uncp.edu.pe / agronomia@uncp.edu.pe — contraseña: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
