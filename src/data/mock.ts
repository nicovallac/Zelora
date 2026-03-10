import type { Conversation, NavItem, AgentPerformance, MetricsDay, IntentStat, HourStat } from '../types';

export const heroKpis = [
  { label: 'Automatización', value: '74%', sub: 'conversaciones sin asesor' },
  { label: 'Conversaciones/mes', value: '12.8K', sub: 'promedio últimos 3 meses' },
  { label: 'Tiempo promedio', value: '38 seg', sub: 'resolución con IA' },
  { label: 'Satisfacción', value: '91%', sub: 'CSAT afiliados' },
];

export const navItems: NavItem[] = [
  // Main
  { label: 'Dashboard', path: '/', icon: 'LayoutDashboard', audience: 'all' },
  { label: 'Inbox', path: '/inbox', icon: 'MessageSquare', audience: 'all' },
  { label: 'Analytics', path: '/analytics', icon: 'BarChart3', audience: 'all' },
  // Contenido
  { label: 'Base de conocimiento', path: '/knowledge-base', icon: 'BookOpen', audience: 'all' },
  { label: 'Campañas', path: '/campaigns', icon: 'Megaphone', audience: 'all' },
  { label: 'Flujos', path: '/flows', icon: 'GitBranch', audience: 'all' },
  // Configuración
  { label: 'Integraciones', path: '/integrations', icon: 'Plug', audience: 'all' },
  { label: 'Configuración', path: '/settings', icon: 'Settings', audience: 'all' },
  { label: 'Facturación', path: '/billing', icon: 'CreditCard', audience: 'all' },
  // Admin
  { label: 'Agentes', path: '/admin/agents', icon: 'Users', audience: 'admin' },
  { label: 'Contactos', path: '/admin/contacts', icon: 'UserCheck', audience: 'admin' },
  { label: 'Organización', path: '/admin/organizations', icon: 'Building2', audience: 'admin' },
  { label: 'Entrenamiento IA', path: '/admin/training', icon: 'Brain', audience: 'admin' },
  { label: 'Enrutamiento', path: '/admin/routing', icon: 'Shuffle', audience: 'admin' },
];

export const pilotPlan = {
  name: 'Escenario Piloto – Validación de atención automatizada con IA',
  price: '$6.500.000 COP',
  priceNote: 'pago único',
  duration: '1 mes',
  channels: ['WhatsApp', 'Chat Web'],
  includedVolume: 'Hasta 3.000 conversaciones',
  extra: '$180 COP por conversación adicional',
  capabilities: [
    'Chatbot con IA generativa (consultas, FAQ, subsidios, certificados)',
    'Detección automática de intención y sentimiento',
    'Escalamiento inteligente a asesor humano',
    'Bandeja unificada omnicanal para asesores',
  ],
  queryExamples: [
    '¿Cuándo pagan el subsidio familiar?',
    'Necesito un certificado de afiliación',
    '¿Cómo actualizo mis datos?',
    'Quiero radicar una PQRS',
  ],
  integrations: ['WhatsApp Business API', 'Chat web embebido', 'Sistema de tickets interno'],
  platform: ['Dashboard analítico en tiempo real', 'Gestión de plantillas y flujos', 'Reportes de desempeño'],
  infrastructure: 'Nube AWS / GCP con alta disponibilidad. Sin costo de infraestructura durante el piloto.',
  aiNote: 'El costo de tokens IA (OpenAI/Anthropic) se incluye en el piloto hasta el volumen acordado.',
};

export const recurringPlans = [
  {
    name: 'Plan Base',
    price: '$1.799.000',
    period: 'COP / mes',
    volume: 'Hasta 5.000 conversaciones',
    highlight: false,
    features: [
      'WhatsApp + Chat Web',
      'Chatbot automatizado 24/7',
      'Bandeja para asesores',
      'Escalamiento humano',
      'Dashboard analítico',
    ],
  },
  {
    name: 'Plan Profesional',
    price: '$3.299.000',
    period: 'COP / mes',
    volume: 'Hasta 10.000 conversaciones',
    highlight: true,
    features: [
      'WhatsApp + Chat Web',
      'Dashboard analítico avanzado',
      'Integración con sistemas internos',
      'Clasificación automática de intenciones',
      'Automatizaciones extendidas',
      'Soporte prioritario',
    ],
  },
  {
    name: 'Plan Enterprise',
    price: 'Contactar ventas',
    period: '',
    volume: 'Más de 10.000 conversaciones',
    highlight: false,
    features: [
      'Omnicanal completo (Instagram, TikTok, etc.)',
      'Integraciones CRM / ERP complejas',
      'SLA garantizado',
      'Personalización de flujos avanzada',
      'Soporte dedicado',
    ],
  },
];

export const addons = [
  { name: 'Canal adicional', price: 'desde $450.000', desc: 'Instagram DM, TikTok, Telegram, etc.' },
  { name: 'Integración CRM', price: 'desde $900.000', desc: 'Salesforce, HubSpot, Zoho, etc.' },
  { name: 'Integración sistema interno / ERP', price: 'desde $1.200.000', desc: 'SISFAMILIAR, SISCOMF u otro' },
  { name: 'IA avanzada', price: 'desde $900.000', desc: 'Modelos custom, embeddings semánticos, RAG' },
];

export const whatsappExample = {
  totalAfiliados: '50.000',
  consultasMes: '5.000',
  mensajesPorConsulta: 5,
  totalMensajes: '25.000',
  costo: '$0 USD',
  nota: 'Dentro de la ventana de servicio reactivo (24h)',
};

export const whatsappCategoryPrices = [
  { tipo: 'Utilidad', precio: '~$0,0009 USD', ejemplo: 'Confirmación de trámite, notificación de pago' },
  { tipo: 'Marketing', precio: '~$0,014 USD', ejemplo: 'Campaña informativa, novedad de beneficios' },
  { tipo: 'Autenticación', precio: '~$0,007 USD', ejemplo: 'Código OTP, verificación de identidad' },
];

export const mockConversations: Conversation[] = [
  {
    id: 'c1',
    channel: 'whatsapp',
    status: 'escalado',
    user: {
      id: 'u1',
      nombre: 'María Fernanda',
      apellido: 'Díaz Molina',
      telefono: '+57 310 234 5678',
      email: 'mfdiazmolina@gmail.com',
      cedula: '1.090.123.456',
      tipoAfiliado: 'trabajador',
    },
    intent: 'Subsidio familiar',
    sentiment: 'neutro',
    assignedAgent: 'Carlos Pérez',
    createdAt: '2026-03-09T09:12:00Z',
    lastMessageAt: '2026-03-09T09:28:00Z',
    lastMessage: 'Ya estoy revisando tu caso, dame 2 minutos.',
    messages: [
      { id: 'm1', role: 'user', content: 'Hola, necesito saber cuándo pagan el subsidio familiar de marzo.', timestamp: '2026-03-09T09:12:00Z' },
      { id: 'm2', role: 'bot', content: '¡Hola, María Fernanda! 👋 Soy el asistente virtual de COMFAGUAJIRA. Te ayudo a consultar el estado de tu subsidio familiar. ¿Puedes confirmarme tu número de cédula?', timestamp: '2026-03-09T09:12:05Z' },
      { id: 'm3', role: 'user', content: '1.090.123.456', timestamp: '2026-03-09T09:13:00Z' },
      { id: 'm4', role: 'bot', content: 'Validando tu información... 🔍 Encontré tu registro. Tu subsidio de marzo está programado para el 15 de marzo de 2026 mediante transferencia bancaria a tu cuenta Bancolombia. ¿Hay algo más en lo que pueda ayudarte?', timestamp: '2026-03-09T09:13:08Z' },
      { id: 'm5', role: 'user', content: 'Pero no me ha llegado a la cuenta, ya pasó el día 15.', timestamp: '2026-03-09T09:20:00Z' },
      { id: 'm6', role: 'bot', content: 'Entiendo tu inquietud. Voy a escalarte con un asesor especializado que puede revisar el estado del depósito directamente con el área de pagos. ¿De acuerdo?', timestamp: '2026-03-09T09:20:10Z' },
      { id: 'm7', role: 'user', content: 'Sí, por favor.', timestamp: '2026-03-09T09:21:00Z' },
      { id: 'm8', role: 'agent', content: 'Hola María Fernanda, soy Carlos del área de subsidios. Ya estoy revisando tu caso, dame 2 minutos.', timestamp: '2026-03-09T09:28:00Z' },
    ],
    timeline: [
      { id: 'e1', tipo: 'bot_start', descripcion: 'Conversación iniciada por el afiliado en WhatsApp', timestamp: '2026-03-09T09:12:00Z' },
      { id: 'e2', tipo: 'intent_detected', descripcion: 'Intención detectada: Subsidio familiar (confianza 94%)', timestamp: '2026-03-09T09:12:05Z' },
      { id: 'e3', tipo: 'escalated', descripcion: 'Escalado a asesor — motivo: depósito no recibido', timestamp: '2026-03-09T09:21:30Z' },
      { id: 'e4', tipo: 'agent_reply', descripcion: 'Asesor Carlos Pérez tomó la conversación', timestamp: '2026-03-09T09:28:00Z' },
    ],
  },
  {
    id: 'c2',
    channel: 'web',
    status: 'resuelto',
    user: {
      id: 'u2',
      nombre: 'Jorge Armando',
      apellido: 'Ríos Palomino',
      telefono: '+57 315 876 5432',
      email: 'jarios@empresa.com',
      cedula: '72.123.789',
      tipoAfiliado: 'trabajador',
    },
    intent: 'Certificado de afiliación',
    sentiment: 'positivo',
    assignedAgent: undefined,
    createdAt: '2026-03-09T08:00:00Z',
    lastMessageAt: '2026-03-09T08:05:00Z',
    lastMessage: 'Perfecto, ya lo descargué. Gracias!',
    messages: [
      { id: 'm1', role: 'user', content: 'Necesito un certificado de afiliación para el banco.', timestamp: '2026-03-09T08:00:00Z' },
      { id: 'm2', role: 'bot', content: '¡Claro! Te genero el certificado de afiliación al instante. Ingresa tu cédula para continuar.', timestamp: '2026-03-09T08:00:05Z' },
      { id: 'm3', role: 'user', content: '72.123.789', timestamp: '2026-03-09T08:01:00Z' },
      { id: 'm4', role: 'bot', content: '✅ Certificado generado exitosamente. Puedes descargarlo en el siguiente enlace: [Descargar PDF]. Vigencia: 30 días.', timestamp: '2026-03-09T08:01:10Z' },
      { id: 'm5', role: 'user', content: 'Perfecto, ya lo descargué. Gracias!', timestamp: '2026-03-09T08:05:00Z' },
    ],
    timeline: [
      { id: 'e1', tipo: 'bot_start', descripcion: 'Conversación iniciada en Chat Web', timestamp: '2026-03-09T08:00:00Z' },
      { id: 'e2', tipo: 'intent_detected', descripcion: 'Intención detectada: Certificado de afiliación (confianza 98%)', timestamp: '2026-03-09T08:00:05Z' },
      { id: 'e3', tipo: 'resolved', descripcion: 'Resuelta por IA sin escalamiento', timestamp: '2026-03-09T08:05:30Z' },
    ],
  },
  {
    id: 'c3',
    channel: 'instagram',
    status: 'en_proceso',
    user: {
      id: 'u3',
      nombre: 'Valentina',
      apellido: 'Ospina Cruz',
      telefono: '@vospina_oficial',
      email: 'vospina@hotmail.com',
      cedula: '1.143.567.890',
      tipoAfiliado: 'independiente',
    },
    intent: 'PQRS',
    sentiment: 'negativo',
    assignedAgent: 'Laura Gutiérrez',
    createdAt: '2026-03-09T10:30:00Z',
    lastMessageAt: '2026-03-09T10:45:00Z',
    lastMessage: 'Voy a radicar tu PQRS ahora mismo.',
    messages: [
      { id: 'm1', role: 'user', content: 'Llevan 3 semanas y no me dan respuesta sobre mi afiliación como independiente. Esto es un pésimo servicio.', timestamp: '2026-03-09T10:30:00Z' },
      { id: 'm2', role: 'bot', content: 'Hola Valentina, entiendo tu frustración y lamento los inconvenientes. Quiero ayudarte a resolver esto. ¿Puedo tomar nota de tu caso para radicarlo como PQRS prioritaria?', timestamp: '2026-03-09T10:30:10Z' },
      { id: 'm3', role: 'user', content: 'Sí, pero ya veces lo hago y nunca responden.', timestamp: '2026-03-09T10:32:00Z' },
      { id: 'm4', role: 'bot', content: 'Comprendo. Voy a escalar tu caso con una asesora especializada que te dará seguimiento personalizado. Un momento...', timestamp: '2026-03-09T10:32:15Z' },
      { id: 'm5', role: 'agent', content: 'Hola Valentina, soy Laura del equipo de PQRS. Voy a radicar tu PQRS ahora mismo y te envío el número de radicado.', timestamp: '2026-03-09T10:45:00Z' },
    ],
    timeline: [
      { id: 'e1', tipo: 'bot_start', descripcion: 'DM recibido en Instagram', timestamp: '2026-03-09T10:30:00Z' },
      { id: 'e2', tipo: 'intent_detected', descripcion: 'Intención: PQRS — Sentimiento negativo detectado', timestamp: '2026-03-09T10:30:10Z' },
      { id: 'e3', tipo: 'escalated', descripcion: 'Escalado prioritario por sentimiento negativo', timestamp: '2026-03-09T10:32:15Z' },
      { id: 'e4', tipo: 'agent_reply', descripcion: 'Asesora Laura Gutiérrez asignada', timestamp: '2026-03-09T10:45:00Z' },
    ],
  },
  {
    id: 'c4',
    channel: 'whatsapp',
    status: 'nuevo',
    user: {
      id: 'u4',
      nombre: 'Pedro José',
      apellido: 'Martínez Fonseca',
      telefono: '+57 301 456 7890',
      email: 'pjmartinez@yahoo.com',
      cedula: '79.567.234',
      tipoAfiliado: 'pensionado',
    },
    intent: 'Recreación y turismo',
    sentiment: 'positivo',
    assignedAgent: undefined,
    createdAt: '2026-03-09T11:00:00Z',
    lastMessageAt: '2026-03-09T11:01:00Z',
    lastMessage: '¿Qué paquetes de turismo tienen disponibles?',
    messages: [
      { id: 'm1', role: 'user', content: '¿Qué paquetes de turismo tienen disponibles para pensionados?', timestamp: '2026-03-09T11:00:00Z' },
      { id: 'm2', role: 'bot', content: '¡Hola Pedro José! 🌴 COMFAGUAJIRA tiene excelentes paquetes de recreación para pensionados. Tenemos destinos nacionales como Cartagena, Santa Marta y Medellín con tarifas preferenciales. ¿Te interesa que te envíe el catálogo completo?', timestamp: '2026-03-09T11:00:08Z' },
    ],
    timeline: [
      { id: 'e1', tipo: 'bot_start', descripcion: 'Conversación iniciada en WhatsApp', timestamp: '2026-03-09T11:00:00Z' },
      { id: 'e2', tipo: 'intent_detected', descripcion: 'Intención: Recreación y turismo (confianza 91%)', timestamp: '2026-03-09T11:00:08Z' },
    ],
  },
  {
    id: 'c5',
    channel: 'tiktok',
    status: 'resuelto',
    user: {
      id: 'u5',
      nombre: 'Sofía',
      apellido: 'Hernández Bello',
      telefono: '@sofiahbello',
      email: 'sofia.hbello@gmail.com',
      cedula: '1.065.890.123',
      tipoAfiliado: 'trabajador',
    },
    intent: 'Información general',
    sentiment: 'positivo',
    assignedAgent: undefined,
    createdAt: '2026-03-08T18:00:00Z',
    lastMessageAt: '2026-03-08T18:02:00Z',
    lastMessage: 'Gracias! Voy a ingresar al chat web ahora.',
    messages: [
      { id: 'm1', role: 'user', content: 'Vi el video sobre los beneficios y quiero saber más sobre el subsidio. ¿Cómo me registro?', timestamp: '2026-03-08T18:00:00Z' },
      { id: 'm2', role: 'bot', content: '¡Hola! 👋 Me alegra tu interés. Para más información sobre beneficios y subsidios, te invito a chatear con nosotros en nuestra página web: comfaguajira.com/chat — ¡Atención 24/7!', timestamp: '2026-03-08T18:00:10Z' },
      { id: 'm3', role: 'user', content: 'Gracias! Voy a ingresar al chat web ahora.', timestamp: '2026-03-08T18:02:00Z' },
    ],
    timeline: [
      { id: 'e1', tipo: 'bot_start', descripcion: 'DM recibido desde comentario en TikTok', timestamp: '2026-03-08T18:00:00Z' },
      { id: 'e2', tipo: 'intent_detected', descripcion: 'Intención: Información general', timestamp: '2026-03-08T18:00:10Z' },
      { id: 'e3', tipo: 'resolved', descripcion: 'Derivado a canal web — conversación cerrada', timestamp: '2026-03-08T18:02:30Z' },
    ],
  },
];

export const agentPerformance: AgentPerformance[] = [
  { id: 'a1', nombre: 'Carlos Pérez', conversaciones: 89, resueltas: 76, escaladas: 8, tiempoPromedio: '4.2 min', satisfaccion: 94 },
  { id: 'a2', nombre: 'Laura Gutiérrez', conversaciones: 102, resueltas: 90, escaladas: 5, tiempoPromedio: '3.8 min', satisfaccion: 96 },
  { id: 'a3', nombre: 'Andrés Morales', conversaciones: 67, resueltas: 55, escaladas: 12, tiempoPromedio: '6.1 min', satisfaccion: 88 },
  { id: 'a4', nombre: 'Diana Suárez', conversaciones: 95, resueltas: 84, escaladas: 6, tiempoPromedio: '4.5 min', satisfaccion: 92 },
];

export const metricsTimeline: MetricsDay[] = [
  { fecha: 'Lun', web: 320, whatsapp: 560, instagram: 240, tiktok: 140 },
  { fecha: 'Mar', web: 290, whatsapp: 610, instagram: 220, tiktok: 120 },
  { fecha: 'Mié', web: 380, whatsapp: 540, instagram: 280, tiktok: 160 },
  { fecha: 'Jue', web: 410, whatsapp: 590, instagram: 310, tiktok: 190 },
  { fecha: 'Vie', web: 460, whatsapp: 680, instagram: 350, tiktok: 210 },
  { fecha: 'Sáb', web: 240, whatsapp: 420, instagram: 290, tiktok: 180 },
  { fecha: 'Dom', web: 180, whatsapp: 310, instagram: 200, tiktok: 130 },
];

export const intentStats: IntentStat[] = [
  { nombre: 'Subsidio familiar', count: 3840, porcentaje: 30 },
  { nombre: 'Certificado de afiliación', count: 2560, porcentaje: 20 },
  { nombre: 'PQRS', count: 1920, porcentaje: 15 },
  { nombre: 'Recreación y turismo', count: 1664, porcentaje: 13 },
  { nombre: 'Actualización de datos', count: 1280, porcentaje: 10 },
  { nombre: 'Información general', count: 896, porcentaje: 7 },
  { nombre: 'Otros', count: 642, porcentaje: 5 },
];

export const hourStats: HourStat[] = [
  { hora: '6am', total: 120 },
  { hora: '7am', total: 340 },
  { hora: '8am', total: 680 },
  { hora: '9am', total: 920 },
  { hora: '10am', total: 1100 },
  { hora: '11am', total: 980 },
  { hora: '12m', total: 760 },
  { hora: '1pm', total: 640 },
  { hora: '2pm', total: 850 },
  { hora: '3pm', total: 930 },
  { hora: '4pm', total: 880 },
  { hora: '5pm', total: 720 },
  { hora: '6pm', total: 540 },
  { hora: '7pm', total: 380 },
  { hora: '8pm', total: 220 },
  { hora: '9pm', total: 140 },
];

// Knowledge Base mock articles
export const mockKBArticles = [
  {
    id: 'kb1',
    titulo: 'Proceso de pago del subsidio familiar',
    categoria: 'Subsidios',
    contenido: `## ¿Cuándo se paga el subsidio familiar?\n\nEl subsidio familiar se paga el **día 15 de cada mes** mediante transferencia bancaria a la cuenta registrada en el sistema.\n\n### Requisitos para recibir el pago\n- Estar activo como trabajador dependiente\n- Tener reporte patronal al día\n- Cuenta bancaria registrada y activa\n\n### ¿Qué hacer si no llegó el pago?\n1. Verificar que la cuenta bancaria esté activa\n2. Confirmar que el empleador reportó el mes\n3. Contactar a COMFAGUAJIRA vía WhatsApp o sede\n\n### Montos actuales (2026)\n| Categoría | Monto mensual |\n|-----------|---------------|\n| Un hijo | $115.000 COP |\n| Dos hijos | $230.000 COP |\n| Tres o más | $345.000 COP |`,
    tags: ['subsidio', 'pago', 'transferencia'],
    activo: true,
    visitas: 1842,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'kb2',
    titulo: 'Cómo obtener el certificado de afiliación',
    categoria: 'Certificados',
    contenido: `## Certificado de afiliación a COMFAGUAJIRA\n\nEl certificado de afiliación es un documento oficial que acredita tu vinculación a la caja de compensación.\n\n### Formas de obtenerlo\n\n**Opción 1 — Portal en línea (inmediato)**\n- Ingresa a comfaguajira.com\n- Sección "Mi COMFAGUAJIRA"\n- Descarga el certificado en PDF\n\n**Opción 2 — Chat o WhatsApp (inmediato)**\n- Escribe "certificado" al chatbot\n- Confirma tu cédula\n- Recibe el PDF en segundos\n\n**Opción 3 — Sede física**\n- Cualquier sede en horario de atención\n- Documento de identidad\n\n### Vigencia\nLos certificados tienen vigencia de **30 días calendario** desde su emisión.`,
    tags: ['certificado', 'afiliación', 'documento'],
    activo: true,
    visitas: 2156,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-02-20T10:00:00Z',
  },
  {
    id: 'kb3',
    titulo: 'Proceso de radicación de PQRS',
    categoria: 'PQRS',
    contenido: `## ¿Cómo radicar una PQRS?\n\nUna PQRS (Petición, Queja, Reclamo o Sugerencia) puede radicarse por los siguientes canales:\n\n### Canales de radicación\n- **WhatsApp**: envía "PQRS" al número oficial\n- **Web**: portal.comfaguajira.com/pqrs\n- **Presencial**: cualquier sede\n- **Email**: pqrs@comfaguajira.com\n\n### Tiempos de respuesta (Ley 1755/2015)\n| Tipo | Tiempo máximo |\n|------|---------------|\n| Petición | 15 días hábiles |\n| Queja | 15 días hábiles |\n| Reclamo | 15 días hábiles |\n| Sugerencia | 30 días hábiles |\n\n### Número de radicado\nCada PQRS recibe un número de radicado para seguimiento. Guárdalo.`,
    tags: ['pqrs', 'queja', 'reclamo', 'petición'],
    activo: true,
    visitas: 987,
    createdAt: '2026-01-20T08:00:00Z',
    updatedAt: '2026-02-28T10:00:00Z',
  },
  {
    id: 'kb4',
    titulo: 'Requisitos para afiliación como trabajador independiente',
    categoria: 'Afiliación',
    contenido: `## Afiliación independiente a COMFAGUAJIRA\n\n### Documentos requeridos\n- Cédula de ciudadanía\n- Declaración de renta o RUT\n- Certificado de ingresos\n- Formulario de afiliación diligenciado\n\n### Pasos del proceso\n1. Reúne los documentos requeridos\n2. Ingresa al portal o ve a una sede\n3. Completa el formulario de afiliación\n4. Paga la cotización mensual\n5. Recibe confirmación en 3 días hábiles\n\n### Costo de cotización (2026)\n- Base: 4% del ingreso mensual (mínimo 1 SMLV)\n- El beneficiario recibe subsidio a partir del mes siguiente`,
    tags: ['afiliación', 'independiente', 'requisitos'],
    activo: true,
    visitas: 743,
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-03-05T10:00:00Z',
  },
  {
    id: 'kb5',
    titulo: 'Planes de recreación y turismo 2026',
    categoria: 'Recreación',
    contenido: `## Beneficios de recreación y turismo\n\n### Destinos disponibles 2026\n| Destino | Precio afiliado | Precio regular |\n|---------|----------------|----------------|\n| Cartagena 3D/2N | $450.000 | $890.000 |\n| Santa Marta 4D/3N | $520.000 | $1.050.000 |\n| Medellín 3D/2N | $380.000 | $750.000 |\n| San Andrés 5D/4N | $890.000 | $1.800.000 |\n\n### ¿Cómo reservar?\n1. Ingresa al portal o llama al *línea de atención*\n2. Selecciona destino y fechas\n3. Paga el 30% de anticipo\n4. Recibe confirmación por email\n\n### Beneficios adicionales\n- Hasta 2 acompañantes por núcleo familiar\n- Seguro de viaje incluido\n- Transporte desde Riohacha`,
    tags: ['recreación', 'turismo', 'viajes', 'beneficios'],
    activo: true,
    visitas: 1234,
    createdAt: '2026-02-10T08:00:00Z',
    updatedAt: '2026-03-08T10:00:00Z',
  },
  {
    id: 'kb6',
    titulo: 'Actualización de datos personales',
    categoria: 'Trámites',
    contenido: `## ¿Cómo actualizar tus datos personales?\n\n### Datos que puedes actualizar\n- Número de celular\n- Correo electrónico\n- Cuenta bancaria\n- Dirección de residencia\n- Información de dependientes (hijos, cónyuge)\n\n### Por portal web\n1. Ingresa con tu cédula y contraseña\n2. Ve a "Mi perfil"\n3. Edita los campos requeridos\n4. Sube los documentos de soporte\n5. Envía la solicitud\n\n### Presencialmente\n- Presenta cédula original\n- Los cambios aplican en máximo 5 días hábiles\n\n### Importante\nLa cuenta bancaria requiere certificación bancaria con menos de 30 días de expedición.`,
    tags: ['datos', 'actualización', 'cuenta bancaria'],
    activo: true,
    visitas: 654,
    createdAt: '2026-02-15T08:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
];

export type KBCategory = 'Subsidios' | 'Certificados' | 'PQRS' | 'Afiliación' | 'Recreación' | 'Trámites' | 'General';
export const KB_CATEGORIES: KBCategory[] = ['Subsidios', 'Certificados', 'PQRS', 'Afiliación', 'Recreación', 'Trámites', 'General'];

// Campaigns mock
export const mockTemplates = [
  { id: 't1', nombre: 'confirmacion_tramite', categoria: 'utilidad', idioma: 'es', estado: 'approved', contenido: 'Hola {{1}}, tu trámite {{2}} fue registrado exitosamente. Número de radicado: {{3}}. Te responderemos en {{4}} días hábiles.', variables: ['nombre', 'tipo_tramite', 'radicado', 'dias'], createdAt: '2026-01-05T08:00:00Z' },
  { id: 't2', nombre: 'pago_subsidio', categoria: 'utilidad', idioma: 'es', estado: 'approved', contenido: 'Hola {{1}}, tu subsidio familiar de {{2}} por ${{3}} COP fue procesado y llegará a tu cuenta el {{4}}. 💰', variables: ['nombre', 'mes', 'monto', 'fecha'], createdAt: '2026-01-10T08:00:00Z' },
  { id: 't3', nombre: 'campana_recreacion', categoria: 'marketing', idioma: 'es', estado: 'approved', contenido: '🌴 ¡{{1}}, tenemos paquetes de recreación con descuentos de hasta el 50%! Destinos disponibles: Cartagena, Santa Marta, San Andrés. Responde SÍ para más información.', variables: ['nombre'], createdAt: '2026-02-01T08:00:00Z' },
  { id: 't4', nombre: 'verificacion_otp', categoria: 'autenticacion', idioma: 'es', estado: 'approved', contenido: 'Tu código de verificación COMFAGUAJIRA es: {{1}}. Válido por {{2}} minutos. No compartas este código.', variables: ['codigo', 'minutos'], createdAt: '2026-01-20T08:00:00Z' },
  { id: 't5', nombre: 'recordatorio_documentos', categoria: 'utilidad', idioma: 'es', estado: 'pending', contenido: 'Hola {{1}}, tu solicitud de {{2}} requiere documentos adicionales. Por favor entrégalos antes del {{3}} para continuar el proceso.', variables: ['nombre', 'tramite', 'fecha_limite'], createdAt: '2026-03-01T08:00:00Z' },
];

export const mockCampaigns = [
  { id: 'camp1', nombre: 'Campaña Subsidio Marzo 2026', tipo: 'utilidad', plantillaId: 't2', estado: 'completada', total: 4820, enviados: 4820, leidos: 4312, respondidos: 1876, createdAt: '2026-03-01T08:00:00Z', scheduledAt: '2026-03-14T08:00:00Z' },
  { id: 'camp2', nombre: 'Oferta Recreación Semana Santa', tipo: 'marketing', plantillaId: 't3', estado: 'programada', total: 12400, enviados: 0, leidos: 0, respondidos: 0, createdAt: '2026-03-08T08:00:00Z', scheduledAt: '2026-03-20T07:00:00Z' },
  { id: 'camp3', nombre: 'Notificación PQRS Pendientes', tipo: 'utilidad', plantillaId: 't5', estado: 'borrador', total: 0, enviados: 0, leidos: 0, respondidos: 0, createdAt: '2026-03-10T08:00:00Z', scheduledAt: null },
];

// Flow builder mock
export type FlowNodeType = 'start' | 'message' | 'condition' | 'quickReply' | 'collect' | 'escalate' | 'end' | 'api';
export const mockFlows = [
  {
    id: 'flow1',
    nombre: 'Flujo Consulta Subsidio',
    descripcion: 'Flujo principal para consulta de subsidio familiar',
    activo: true,
    canal: 'whatsapp',
    nodes: [
      { id: 'n1', tipo: 'start' as FlowNodeType, label: 'Inicio', x: 100, y: 100 },
      { id: 'n2', tipo: 'message' as FlowNodeType, label: 'Bienvenida', contenido: '¡Hola! 👋 Soy el asistente de COMFAGUAJIRA. ¿En qué puedo ayudarte?', x: 100, y: 220 },
      { id: 'n3', tipo: 'quickReply' as FlowNodeType, label: 'Menú principal', opciones: ['💰 Subsidio', '📄 Certificado', '📋 PQRS', '👤 Asesor'], x: 100, y: 360 },
      { id: 'n4', tipo: 'collect' as FlowNodeType, label: 'Pedir cédula', pregunta: '¿Me das tu número de cédula?', variable: 'cedula', x: 100, y: 500 },
      { id: 'n5', tipo: 'api' as FlowNodeType, label: 'Consultar BD', endpoint: '/integrations/subsidio', x: 100, y: 640 },
      { id: 'n6', tipo: 'message' as FlowNodeType, label: 'Respuesta subsidio', contenido: 'Tu subsidio de {mes} está programado para el {fecha} por ${monto} COP.', x: 100, y: 780 },
      { id: 'n7', tipo: 'end' as FlowNodeType, label: 'Fin', x: 100, y: 900 },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4', label: 'Subsidio' },
      { id: 'e4', source: 'n4', target: 'n5' },
      { id: 'e5', source: 'n5', target: 'n6' },
      { id: 'e6', source: 'n6', target: 'n7' },
    ],
    createdAt: '2026-02-01T08:00:00Z',
  },
];

// Organization mock
export const mockOrganization = {
  id: 'org1',
  nombre: 'COMFAGUAJIRA',
  nit: '891.180.057-1',
  plan: 'enterprise',
  logo: null,
  configuracion: {
    horario: { inicio: '08:00', fin: '18:00', dias: ['lun','mar','mié','jue','vie'] },
    slaMinutos: 10,
    autoEscalarMinutos: 15,
    idiomaPrincipal: 'es',
  },
  createdAt: '2026-01-01T00:00:00Z',
};

// QA Score mock
export const mockQAScores: Record<string, number> = {
  c1: 72,
  c2: 96,
  c3: 58,
  c4: 88,
  c5: 91,
};

// AI Copilot suggestions mock
export const mockCopilotSuggestions: Record<string, string[]> = {
  'Subsidio familiar': [
    'Puedo verificar el estado de tu subsidio ahora mismo. ¿Me confirmas tu número de cédula?',
    'Tu subsidio familiar se paga el día 15 de cada mes. ¿Deseas que consulte el estado de tu pago?',
    'Para consultar tu subsidio necesito validar tu identidad. ¿Cuál es tu cédula?',
  ],
  'Certificado de afiliación': [
    'Genero tu certificado de afiliación inmediatamente. Dame tu número de cédula.',
    'El certificado puede descargarse por nuestro portal o puedo enviártelo aquí. ¿Cuál prefieres?',
    'Tu certificado tiene vigencia de 30 días. ¿Lo necesitas en PDF o puedo enviarte el link de descarga?',
  ],
  'PQRS': [
    'Entiendo tu situación. Voy a registrar tu PQRS de inmediato. ¿Me describes brevemente el motivo?',
    'Tu caso merece atención prioritaria. Procedo a radicar una PQRS y te asigno un número de seguimiento.',
    'Lamento los inconvenientes. Para radicar tu PQRS necesito: tipo de solicitud, descripción y datos de contacto.',
  ],
  'default': [
    'Entiendo tu consulta. Permíteme verificar la información en nuestros sistemas.',
    'Puedo ayudarte con eso. ¿Me das más detalles sobre tu solicitud?',
    'Estoy revisando tu caso. Un momento, por favor.',
  ],
};

// Integrations mock
export const mockIntegrations = [
  { id: 'int1', nombre: 'Base de datos afiliados SISFAMILIAR', categoria: 'BD', estado: 'conectado', lastSync: '2026-03-10T09:55:00Z', registros: 52431, color: 'bg-blue-600', initials: 'SF' },
  { id: 'int2', nombre: 'Sistema de Certificados', categoria: 'BD', estado: 'conectado', lastSync: '2026-03-10T08:00:00Z', registros: 8234, color: 'bg-violet-600', initials: 'SC' },
];

export const mockAuditLog = [
  { id: 'al1', evento: 'Inicio de sesión exitoso', usuario: 'carlos.perez@comfaguajira.com', ip: '186.29.45.12', timestamp: '2026-03-10T09:30:00Z', tipo: 'auth' },
  { id: 'al2', evento: 'Conversación escalada manualmente', usuario: 'laura.gutierrez@comfaguajira.com', ip: '186.29.45.18', timestamp: '2026-03-10T09:15:00Z', tipo: 'action' },
  { id: 'al3', evento: 'Nuevo asesor creado', usuario: 'carlos.perez@comfaguajira.com', ip: '186.29.45.12', timestamp: '2026-03-10T08:45:00Z', tipo: 'admin' },
  { id: 'al4', evento: 'Artículo KB modificado', usuario: 'diana.suarez@comfaguajira.com', ip: '186.29.45.22', timestamp: '2026-03-10T08:30:00Z', tipo: 'action' },
  { id: 'al5', evento: 'Campaña enviada: Subsidio Marzo', usuario: 'carlos.perez@comfaguajira.com', ip: '186.29.45.12', timestamp: '2026-03-09T08:00:00Z', tipo: 'campaign' },
];

// Training data mock
export const mockTrainingConversations = [
  { id: 'tr1', preview: '¿Cuándo pagan el subsidio de marzo?', intent: 'Subsidio familiar', confidence: 94, qaScore: 96 },
  { id: 'tr2', preview: 'Necesito el certificado para el banco urgente', intent: 'Certificado de afiliación', confidence: 98, qaScore: 91 },
  { id: 'tr3', preview: 'Llevan semanas sin responderme la PQRS radicada', intent: 'PQRS', confidence: 87, qaScore: 85 },
  { id: 'tr4', preview: '¿Tienen paquetes a Cartagena en semana santa?', intent: 'Recreación y turismo', confidence: 91, qaScore: 92 },
  { id: 'tr5', preview: 'Quiero actualizar mi número de cuenta bancaria', intent: 'Actualización de datos', confidence: 89, qaScore: 88 },
  { id: 'tr6', preview: '¿Cómo hago para afiliarme como independiente?', intent: 'Afiliación', confidence: 85, qaScore: 83 },
  { id: 'tr7', preview: '¿Cuánto es el monto del crédito social máximo?', intent: 'Crédito social', confidence: 83, qaScore: 86 },
  { id: 'tr8', preview: 'Quiero inscribirme al curso de sistemas del SENA', intent: 'Capacitación', confidence: 88, qaScore: 90 },
];

// Routing rules mock
export const mockRoutingRules = [
  { id: 'rr1', prioridad: 1, condicion: 'Canal = Instagram', accion: 'Asignar a Diana Suárez', activo: true },
  { id: 'rr2', prioridad: 2, condicion: 'Intención = PQRS', accion: 'Asignar a equipo PQRS', activo: true },
  { id: 'rr3', prioridad: 3, condicion: 'Sentimiento = negativo', accion: 'Escalar a supervisor', activo: true },
  { id: 'rr4', prioridad: 4, condicion: 'Hora > 18:00 o < 8:00', accion: 'Respuesta automática', activo: true },
  { id: 'rr5', prioridad: 5, condicion: 'Sin asesor > 5 min', accion: 'Notificar supervisor', activo: true },
];
