"""
seed.py — Populates the COMFAGUAJIRA chatbot database with realistic demo data.
Run from the backend/ directory:  python seed.py
"""

import sys
import os
import uuid
import random
from datetime import datetime, timedelta

# Allow running from the backend/ directory without installing the package
sys.path.insert(0, os.path.dirname(__file__))

from faker import Faker
from app.database import SessionLocal, engine
from app import models
from app.auth import hash_password
from app.models import DBQAScore, DBTimelineEvent, DBConversation

fake = Faker("es_CO")
random.seed(42)

# ---------------------------------------------------------------------------
# Constants / lookup tables
# ---------------------------------------------------------------------------

INTENTS = [
    "Subsidio familiar",
    "Certificado de afiliación",
    "PQRS",
    "Recreación y turismo",
    "Actualización de datos",
    "Información general",
    "Afiliación",
    "Crédito social",
    "Capacitación",
]

INTENT_WEIGHTS = [30, 20, 15, 13, 10, 7, 5, 4, 3]  # approximate % distribution (not normalized)

CHANNELS = ["web", "whatsapp", "instagram", "tiktok"]
CHANNEL_WEIGHTS = [30, 45, 18, 7]

STATUSES = ["nuevo", "en_proceso", "escalado", "resuelto"]
STATUS_WEIGHTS = [15, 25, 20, 40]

SENTIMENTS = ["positivo", "neutro", "negativo"]
SENTIMENT_WEIGHTS = [50, 35, 15]

TIPOS_AFILIADO = ["trabajador", "pensionado", "independiente"]
TIPOS_AFILIADO_WEIGHTS = [60, 25, 15]

TICKET_TIPOS = ["PQRS", "solicitud", "queja", "reclamo"]

# ---------------------------------------------------------------------------
# Realistic conversation scripts keyed by intent
# ---------------------------------------------------------------------------

CONV_SCRIPTS: dict[str, list[tuple[str, str]]] = {
    "Subsidio familiar": [
        ("user", "Hola, quiero saber cómo solicitar el subsidio familiar para mi familia."),
        ("bot",  "¡Hola! Con gusto te ayudo. El subsidio familiar de COMFAGUAJIRA está disponible para trabajadores afiliados con ingresos menores a 4 SMLMV. ¿Tienes tu cédula a mano?"),
        ("user", "Sí, mi cédula es la que tengo registrada."),
        ("bot",  "Perfecto. Para solicitar el subsidio debes radicar: certificado laboral, últimas 3 nóminas, registro civil de tus beneficiarios y fotocopia de cédula. ¿Te gustaría que te enviara el formulario de solicitud?"),
        ("user", "Sí, por favor."),
        ("bot",  "Te acabo de enviar el formulario al correo registrado. Recuerda que el trámite tarda entre 5 y 10 días hábiles. ¿Hay algo más en lo que te pueda ayudar?"),
        ("user", "No, muchas gracias."),
        ("bot",  "¡Con gusto! Recuerda que puedes contactarnos por este chat, WhatsApp o visitar nuestras oficinas en Riohacha. ¡Hasta pronto!"),
    ],
    "Certificado de afiliación": [
        ("user", "Necesito un certificado de afiliación urgente para un trámite bancario."),
        ("bot",  "Entendido. Puedo generarte el certificado de afiliación en línea. Por favor confirma tu número de cédula para verificar tu estado."),
        ("user", "Es la que está registrada en el sistema."),
        ("bot",  "He verificado tu afiliación. Estás activo como trabajador desde 2018. ¿Deseas el certificado en PDF al correo registrado o prefieres descargarlo directamente aquí?"),
        ("user", "Al correo, por favor."),
        ("bot",  "Listo, te lo he enviado. El certificado tiene vigencia de 30 días y está firmado digitalmente. ¿Necesitas algo más?"),
        ("user", "No, eso es todo. Gracias."),
    ],
    "PQRS": [
        ("user", "Quiero poner una queja porque llevan 3 semanas y no me han respondido mi solicitud de subsidio."),
        ("bot",  "Lamentamos la demora. Voy a escalar tu caso a un asesor especializado para que lo revise con prioridad. ¿Puedes darme el número de radicado de tu solicitud?"),
        ("user", "El radicado es SOL-2024-00892."),
        ("bot",  "Gracias. He registrado tu PQRS con número TKT-2024-4471. Un asesor te contactará en menos de 24 horas hábiles. Disculpa los inconvenientes causados."),
        ("user", "Espero que lo resuelvan pronto."),
        ("bot",  "Así será. Tu caso queda marcado como prioritario. ¿Hay algo más en lo que pueda ayudarte?"),
    ],
    "Recreación y turismo": [
        ("user", "Hola, ¿qué paquetes turísticos tienen disponibles para diciembre?"),
        ("bot",  "¡Hola! Tenemos excelentes paquetes para diciembre. Algunos destinos disponibles: Cartagena (3 noches), Santa Marta (4 noches), Medellín (3 noches) y San Andrés (5 noches). ¿Cuántas personas viajan?"),
        ("user", "Somos 4, dos adultos y dos niños."),
        ("bot",  "Perfecto. Para una familia de 4 tenemos el paquete Caribe Familiar a Cartagena desde $1.850.000 por persona (todo incluido). ¿Te gustaría ver más detalles o ver otras opciones?"),
        ("user", "¿Incluye transporte desde Riohacha?"),
        ("bot",  "Sí, el paquete incluye transporte terrestre desde Riohacha, alojamiento en hotel 3 estrellas, desayunos y seguro de viaje. El transporte aéreo tiene un costo adicional de $320.000 por persona. ¿Quieres reservar?"),
        ("user", "Déjame consultarlo con mi esposa y les escribo después."),
        ("bot",  "Claro, tómate tu tiempo. Recuerda que los cupos son limitados para temporada alta. Cuando quieras reservar escríbenos y te ayudamos. ¡Buen día!"),
    ],
    "Actualización de datos": [
        ("user", "Necesito actualizar mi número de teléfono y dirección en el sistema."),
        ("bot",  "Claro, puedo ayudarte con eso. Para actualizar tus datos personales necesito verificar tu identidad. ¿Me confirmas tu fecha de nacimiento?"),
        ("user", "15 de marzo de 1985."),
        ("bot",  "Verificado. ¿Cuál es el nuevo número de teléfono y la nueva dirección que deseas registrar?"),
        ("user", "El nuevo teléfono es 3124567890 y la dirección es Calle 15 #8-42, Riohacha."),
        ("bot",  "He actualizado tu teléfono y dirección en el sistema. Los cambios se reflejarán en máximo 24 horas. ¿Necesitas actualizar algún otro dato?"),
        ("user", "No, eso es todo. Gracias."),
        ("bot",  "Perfecto. ¡Hasta pronto!"),
    ],
    "Información general": [
        ("user", "¿Cuáles son los horarios de atención de las oficinas en Riohacha?"),
        ("bot",  "Nuestras oficinas en Riohacha están ubicadas en Calle 7 #4-55, Centro. El horario de atención es lunes a viernes de 7:30 a.m. a 12:00 p.m. y de 2:00 p.m. a 5:30 p.m. Los sábados atendemos de 8:00 a.m. a 12:00 m."),
        ("user", "¿Y en Maicao también tienen oficina?"),
        ("bot",  "Sí, tenemos oficina en Maicao en la Calle 11 #10-25. El horario es el mismo que en Riohacha. ¿Necesitas información adicional?"),
        ("user", "No, eso es todo. Gracias."),
    ],
    "Afiliación": [
        ("user", "Hola, soy empleador y quiero afiliar a mis trabajadores a COMFAGUAJIRA."),
        ("bot",  "¡Bienvenido! Para afiliar a tu empresa y trabajadores necesitas: Certificado de existencia y representación legal, RUT, nómina del último mes y datos del representante legal. ¿Cuántos trabajadores tienes?"),
        ("user", "Tenemos 12 trabajadores."),
        ("bot",  "Perfecto. Con 12 trabajadores tu aporte mensual sería del 4% de la nómina total destinado a caja de compensación. ¿Quieres que un asesor comercial te contacte para completar el proceso?"),
        ("user", "Sí, que me llamen por favor."),
        ("bot",  "Anotado. Un asesor comercial te llamará en las próximas 2 horas hábiles al número registrado. ¿Hay algo más en lo que te pueda ayudar?"),
        ("user", "No, con eso está bien."),
        ("bot",  "¡Gracias por elegir COMFAGUAJIRA! Hasta pronto."),
    ],
    "Crédito social": [
        ("user", "¿Qué tipos de crédito social ofrece COMFAGUAJIRA?"),
        ("bot",  "Ofrecemos varias líneas de crédito social: Crédito de libre inversión (hasta $5.000.000), Crédito educativo (hasta $8.000.000), Crédito para vivienda (hasta $15.000.000) y Crédito de emergencia (hasta $2.000.000). ¿Cuál te interesa?"),
        ("user", "El educativo, para pagar la universidad de mi hijo."),
        ("bot",  "El crédito educativo cubre matrícula, materiales y sostenimiento. Tasa del 1.2% mensual, plazo hasta 36 meses. Requisitos: 6 meses de afiliación continua, extractos bancarios y paz y salvo con COMFAGUAJIRA. ¿Te envío la solicitud?"),
        ("user", "Sí, por favor."),
        ("bot",  "Perfecto. Te he enviado el formulario al correo registrado. El análisis de crédito tarda 3 días hábiles. ¿Necesitas algo más?"),
        ("user", "No, muchas gracias."),
    ],
    "Capacitación": [
        ("user", "¿Tienen cursos de capacitación disponibles este mes?"),
        ("bot",  "¡Hola! Sí, tenemos un amplio portafolio de capacitaciones para afiliados. Este mes hay cursos de: Excel avanzado (virtual), Emprendimiento y negocios, Inglés básico, Repostería y panadería, y Electricidad residencial. ¿Cuál te interesa?"),
        ("user", "El de Excel, ¿cuándo empieza y cuánto cuesta?"),
        ("bot",  "El curso de Excel avanzado inicia el próximo lunes 15. Es completamente virtual, con 40 horas de duración los martes y jueves de 6 p.m. a 8 p.m. Para afiliados activos tiene un subsidio del 80%, pagas solo $60.000. ¿Te inscribimos?"),
        ("user", "Sí, por favor inscríbeme."),
        ("bot",  "¡Listo! Te he inscrito en el curso de Excel avanzado. Recibirás un correo con el enlace de acceso y el reglamento del curso. ¿Algo más?"),
        ("user", "No, eso es todo. Gracias."),
        ("bot",  "¡Mucho éxito en el curso! Hasta pronto."),
    ],
}

# ---------------------------------------------------------------------------
# Agent seed data
# ---------------------------------------------------------------------------

AGENTS_DATA = [
    {"nombre": "Carlos Pérez", "email": "carlos.perez@comfaguajira.com", "rol": "admin"},
    {"nombre": "Laura Gutiérrez", "email": "laura.gutierrez@comfaguajira.com", "rol": "asesor"},
    {"nombre": "Andrés Morales", "email": "andres.morales@comfaguajira.com", "rol": "asesor"},
    {"nombre": "Diana Suárez", "email": "diana.suarez@comfaguajira.com", "rol": "asesor"},
]

# ---------------------------------------------------------------------------
# Colombian first/last names pool for more realism
# ---------------------------------------------------------------------------

NOMBRES = [
    "Andrés", "Bibiana", "Camilo", "Claudia", "David", "Diana", "Esteban",
    "Fernanda", "Gabriel", "Hadith", "Isabel", "Javier", "Karen", "Luis",
    "Marcela", "Miguel", "Natalia", "Oscar", "Paola", "Ricardo", "Sandra",
    "Tomás", "Valentina", "Wilmer", "Xiomara", "Yesenia", "Zulma",
    "Alejandro", "Beatriz", "Carlos", "Daniela", "Eduardo", "Fabian",
    "Gloria", "Hernando", "Ingrid", "Jorge", "Karina", "Leonardo",
    "Martha", "Nelson", "Olga", "Pablo", "Rocío", "Sebastián", "Teresa",
    "Uriel", "Verónica", "William", "Ximena",
]

APELLIDOS = [
    "García", "Rodríguez", "Martínez", "López", "González", "Pérez",
    "Sánchez", "Ramírez", "Torres", "Flores", "Rivera", "Gómez",
    "Díaz", "Cruz", "Morales", "Ortiz", "Reyes", "Gutiérrez",
    "Castillo", "Mendoza", "Álvarez", "Ramos", "Herrera", "Jiménez",
    "Vargas", "Suárez", "Salcedo", "Ariza", "Bernal", "Correa",
    "Fonseca", "Ospina", "Parra", "Quintero", "Rojas", "Vega",
    "Acosta", "Barrera", "Cabrera", "Duarte", "Espinosa", "Fuentes",
    "Guerra", "Hoyos", "Ibáñez", "Lozano", "Medina", "Navarro",
    "Pulido", "Quiroga",
]

# ---------------------------------------------------------------------------
# Intent examples for the intents catalog table
# ---------------------------------------------------------------------------

INTENT_EXAMPLES: dict[str, list[str]] = {
    "Subsidio familiar": [
        "¿Cómo solicito el subsidio familiar?",
        "Quiero pedir el subsidio para mis hijos",
        "Cuáles son los requisitos para el subsidio",
    ],
    "Certificado de afiliación": [
        "Necesito un certificado de afiliación",
        "Me pueden expedir el certificado de afiliado",
        "Necesito comprobar que estoy afiliado",
    ],
    "PQRS": [
        "Quiero poner una queja",
        "Tengo un reclamo por un trámite pendiente",
        "Deseo radicar una petición",
    ],
    "Recreación y turismo": [
        "¿Qué paquetes turísticos tienen?",
        "Quiero información sobre viajes para afiliados",
        "¿Tienen plan de vacaciones familiares?",
    ],
    "Actualización de datos": [
        "Necesito cambiar mi teléfono",
        "Quiero actualizar mi dirección",
        "Cómo actualizo mis datos personales",
    ],
    "Información general": [
        "¿Cuál es el horario de atención?",
        "¿Dónde quedan las oficinas?",
        "¿Qué servicios ofrecen?",
    ],
    "Afiliación": [
        "Cómo puedo afiliarme",
        "Quiero afiliar a mi empresa",
        "Cuáles son los pasos para la afiliación",
    ],
    "Crédito social": [
        "¿Ofrecen créditos para afiliados?",
        "Quiero solicitar un crédito educativo",
        "Cuáles son las tasas del crédito social",
    ],
    "Capacitación": [
        "¿Tienen cursos de formación?",
        "Quiero inscribirme en un curso",
        "¿Cuál es el portafolio de capacitaciones?",
    ],
}

# ---------------------------------------------------------------------------
# Pricing catalog data
# ---------------------------------------------------------------------------

PRICING_DATA = [
    {
        "tipo": "pilot",
        "nombre": "Escenario Piloto",
        "precio": 6500000.0,
        "moneda": "COP",
        "descripcion": "1 mes, WhatsApp + Web, hasta 3.000 conversaciones",
        "metadata_": {
            "duracion_meses": 1,
            "canales": ["whatsapp", "web"],
            "conversaciones_incluidas": 3000,
            "onboarding_incluido": True,
            "soporte": "email",
        },
    },
    {
        "tipo": "plan",
        "nombre": "Plan Base",
        "precio": 1799000.0,
        "moneda": "COP",
        "descripcion": "Hasta 5.000 conversaciones/mes",
        "metadata_": {
            "conversaciones_incluidas": 5000,
            "canales_incluidos": 2,
            "agentes_inbox": 3,
            "soporte": "email",
        },
    },
    {
        "tipo": "plan",
        "nombre": "Plan Profesional",
        "precio": 3299000.0,
        "moneda": "COP",
        "descripcion": "Hasta 10.000 conversaciones/mes",
        "metadata_": {
            "conversaciones_incluidas": 10000,
            "canales_incluidos": 4,
            "agentes_inbox": 10,
            "soporte": "chat_prioritario",
        },
    },
    {
        "tipo": "plan",
        "nombre": "Plan Enterprise",
        "precio": None,
        "moneda": "COP",
        "descripcion": "Más de 10.000 conversaciones — precio a medida",
        "metadata_": {
            "conversaciones_incluidas": "ilimitadas",
            "canales_incluidos": "todos",
            "agentes_inbox": "ilimitados",
            "soporte": "dedicado_24_7",
            "sla": "99.9%",
        },
    },
    {
        "tipo": "addon",
        "nombre": "Canal adicional",
        "precio": 450000.0,
        "moneda": "COP",
        "descripcion": "Instagram DM, TikTok, Telegram — por canal/mes",
        "metadata_": {"aplica_a": ["instagram", "tiktok", "telegram"]},
    },
    {
        "tipo": "addon",
        "nombre": "Integración CRM",
        "precio": 900000.0,
        "moneda": "COP",
        "descripcion": "Salesforce, HubSpot, Zoho — setup + primer mes",
        "metadata_": {"crms_soportados": ["salesforce", "hubspot", "zoho"]},
    },
    {
        "tipo": "addon",
        "nombre": "Integración ERP/Sistema interno",
        "precio": 1200000.0,
        "moneda": "COP",
        "descripcion": "SISFAMILIAR u otro sistema — costo de integración",
        "metadata_": {"sistemas": ["SISFAMILIAR", "SAP", "Personalizado"]},
    },
    {
        "tipo": "addon",
        "nombre": "IA avanzada",
        "precio": 900000.0,
        "moneda": "COP",
        "descripcion": "Modelos custom, embeddings, RAG — por mes",
        "metadata_": {"incluye": ["fine-tuning", "embeddings", "RAG", "modelos_privados"]},
    },
    {
        "tipo": "addon",
        "nombre": "Agentes adicionales (inbox)",
        "precio": 120000.0,
        "moneda": "COP",
        "descripcion": "Por agente adicional por mes en el plan Base",
        "metadata_": {"aplica_a": ["Plan Base"]},
    },
    {
        "tipo": "addon",
        "nombre": "Conversaciones adicionales",
        "precio": 180.0,
        "moneda": "COP",
        "descripcion": "Por conversación adicional fuera del paquete incluido",
        "metadata_": {"unidad": "por_conversacion"},
    },
]

# ---------------------------------------------------------------------------
# KB Articles seed data (matching frontend mock)
# ---------------------------------------------------------------------------

KB_ARTICLES_DATA = [
    {
        "titulo": "Requisitos para solicitar el subsidio familiar",
        "categoria": "Subsidios",
        "contenido": (
            "El subsidio familiar de COMFAGUAJIRA está disponible para trabajadores afiliados con ingresos "
            "menores a 4 SMLMV. Para solicitarlo debes presentar los siguientes documentos:\n\n"
            "1. Certificado laboral vigente (no mayor a 30 días)\n"
            "2. Últimas 3 colillas de pago de nómina\n"
            "3. Registro civil de nacimiento de los beneficiarios (hijos menores de 18 años)\n"
            "4. Fotocopia de cédula de ciudadanía del trabajador\n"
            "5. Fotocopia del documento de identidad del cónyuge o compañero permanente (si aplica)\n\n"
            "El trámite puede realizarse de forma presencial en cualquiera de nuestras sedes o a través "
            "del portal web. El tiempo de respuesta es de 5 a 10 días hábiles. El subsidio se paga "
            "mensualmente junto con la nómina del empleador."
        ),
        "tags": ["subsidio", "familiar", "requisitos", "documentos", "beneficiarios"],
    },
    {
        "titulo": "Cómo obtener el certificado de afiliación",
        "categoria": "Certificados",
        "contenido": (
            "El certificado de afiliación es un documento oficial que acredita tu vinculación activa con "
            "COMFAGUAJIRA. Puedes obtenerlo de las siguientes maneras:\n\n"
            "**Por el portal web:**\n"
            "- Ingresa a www.comfaguajira.com.co\n"
            "- Ve a la sección 'Afiliados' > 'Certificados'\n"
            "- Ingresa tu número de cédula y fecha de nacimiento\n"
            "- Descarga el certificado en PDF (firmado digitalmente)\n\n"
            "**Por este chat:**\n"
            "- Solicítalo directamente a nuestro asistente virtual\n"
            "- Te lo enviamos al correo registrado en máximo 5 minutos\n\n"
            "**Presencialmente:**\n"
            "- Visita cualquiera de nuestras sedes con tu cédula original\n\n"
            "El certificado tiene vigencia de 30 días y es aceptado por entidades bancarias, "
            "universidades y entidades gubernamentales."
        ),
        "tags": ["certificado", "afiliación", "documento", "pdf", "portal"],
    },
    {
        "titulo": "Proceso para radicar una PQRS",
        "categoria": "PQRS",
        "contenido": (
            "COMFAGUAJIRA cuenta con un sistema de atención de Peticiones, Quejas, Reclamos y Sugerencias "
            "(PQRS) para garantizar la calidad del servicio.\n\n"
            "**Canales para radicar una PQRS:**\n"
            "- Chat en línea (este canal)\n"
            "- WhatsApp: +57 300 123 4567\n"
            "- Correo electrónico: pqrs@comfaguajira.com.co\n"
            "- Presencialmente en nuestras sedes\n"
            "- Portal web: www.comfaguajira.com.co/pqrs\n\n"
            "**Información requerida:**\n"
            "1. Nombre completo y número de cédula\n"
            "2. Tipo de solicitud (petición, queja, reclamo o sugerencia)\n"
            "3. Descripción detallada del motivo\n"
            "4. Documentos de soporte si aplica\n\n"
            "**Tiempos de respuesta:**\n"
            "- Peticiones y sugerencias: 15 días hábiles\n"
            "- Quejas y reclamos: 10 días hábiles\n\n"
            "Al radicar tu PQRS recibirás un número de radicado para hacer seguimiento."
        ),
        "tags": ["pqrs", "queja", "reclamo", "petición", "sugerencia", "radicado"],
    },
    {
        "titulo": "Paquetes de recreación y turismo para afiliados",
        "categoria": "Recreación",
        "contenido": (
            "COMFAGUAJIRA ofrece planes de recreación y turismo con descuentos especiales para afiliados "
            "activos y sus familias.\n\n"
            "**Destinos disponibles 2026:**\n"
            "- Cartagena: paquetes desde 3 noches — desde $1.850.000 por persona\n"
            "- Santa Marta: paquetes de 4 noches — desde $1.650.000 por persona\n"
            "- Medellín: paquetes de 3 noches — desde $1.400.000 por persona\n"
            "- San Andrés: paquetes de 5 noches — desde $2.900.000 por persona\n"
            "- Bogotá: paquetes de 3 noches — desde $1.200.000 por persona\n\n"
            "**Los paquetes incluyen:**\n"
            "- Transporte terrestre desde Riohacha\n"
            "- Alojamiento en hotel 3 estrellas o superior\n"
            "- Desayunos incluidos\n"
            "- Seguro de viaje\n"
            "- Asistencia en destino\n\n"
            "**Requisitos:**\n"
            "- Estar al día con los aportes a la caja\n"
            "- Mínimo 6 meses de afiliación continua\n"
            "- Reserva con mínimo 15 días de anticipación\n\n"
            "Para reservar comunícate con nuestro equipo de recreación."
        ),
        "tags": ["recreación", "turismo", "paquetes", "viajes", "vacaciones", "familia"],
    },
    {
        "titulo": "Líneas de crédito social disponibles",
        "categoria": "Créditos",
        "contenido": (
            "COMFAGUAJIRA ofrece varias líneas de crédito social con tasas preferenciales para "
            "trabajadores afiliados.\n\n"
            "**Tipos de crédito:**\n\n"
            "1. **Crédito libre inversión**\n"
            "   - Monto: hasta $5.000.000\n"
            "   - Tasa: 1.5% mensual\n"
            "   - Plazo: hasta 24 meses\n\n"
            "2. **Crédito educativo**\n"
            "   - Monto: hasta $8.000.000\n"
            "   - Tasa: 1.2% mensual\n"
            "   - Plazo: hasta 36 meses\n"
            "   - Cubre: matrícula, libros, sostenimiento\n\n"
            "3. **Crédito para vivienda**\n"
            "   - Monto: hasta $15.000.000\n"
            "   - Tasa: 1.0% mensual\n"
            "   - Plazo: hasta 60 meses\n\n"
            "4. **Crédito de emergencia**\n"
            "   - Monto: hasta $2.000.000\n"
            "   - Desembolso en 24 horas\n"
            "   - Tasa: 1.8% mensual\n\n"
            "**Requisitos generales:**\n"
            "- Mínimo 6 meses de afiliación continua\n"
            "- Paz y salvo con COMFAGUAJIRA\n"
            "- Extractos bancarios de los últimos 3 meses\n"
            "- Cédula de ciudadanía vigente"
        ),
        "tags": ["crédito", "social", "educativo", "vivienda", "emergencia", "préstamo"],
    },
    {
        "titulo": "Portafolio de capacitación y formación",
        "categoria": "Capacitación",
        "contenido": (
            "COMFAGUAJIRA ofrece un amplio portafolio de cursos y programas de formación con subsidios "
            "especiales para afiliados activos.\n\n"
            "**Cursos vigentes:**\n\n"
            "**Tecnología e informática:**\n"
            "- Excel avanzado (40 horas, virtual) — $60.000 con subsidio 80%\n"
            "- Marketing digital (30 horas, virtual) — $45.000 con subsidio 80%\n"
            "- Programación básica (50 horas, presencial) — $80.000 con subsidio 80%\n\n"
            "**Emprendimiento:**\n"
            "- Creación de empresas (20 horas, virtual) — Gratuito para afiliados\n"
            "- Finanzas personales (16 horas, virtual) — Gratuito para afiliados\n\n"
            "**Oficios:**\n"
            "- Repostería y panadería (60 horas, presencial) — $120.000 con subsidio 70%\n"
            "- Electricidad residencial (40 horas, presencial) — $90.000 con subsidio 70%\n"
            "- Costura y confección (50 horas, presencial) — $80.000 con subsidio 70%\n\n"
            "**Idiomas:**\n"
            "- Inglés básico (80 horas, virtual) — $150.000 con subsidio 60%\n\n"
            "**Requisitos de inscripción:**\n"
            "- Estar activo como afiliado\n"
            "- Cédula de ciudadanía\n"
            "- Inscripción previa (cupos limitados)"
        ),
        "tags": ["capacitación", "cursos", "formación", "excel", "emprendimiento", "idiomas"],
    },
]

# ---------------------------------------------------------------------------
# Templates seed data
# ---------------------------------------------------------------------------

TEMPLATES_DATA = [
    {
        "nombre": "bienvenida_afiliado",
        "categoria": "utilidad",
        "idioma": "es",
        "contenido": "Hola {{1}}, bienvenido a COMFAGUAJIRA. Tu afiliación ha sido procesada exitosamente. Tu número de afiliado es {{2}}. ¿En qué podemos ayudarte hoy?",
        "variables": ["nombre", "numero_afiliado"],
        "estado": "approved",
    },
    {
        "nombre": "recordatorio_pago",
        "categoria": "utilidad",
        "idioma": "es",
        "contenido": "Estimado {{1}}, te recordamos que el pago de tu aporte mensual vence el {{2}}. Para evitar inconvenientes en tus servicios, realiza tu pago a tiempo. Monto: ${{3}}.",
        "variables": ["nombre", "fecha_vencimiento", "monto"],
        "estado": "approved",
    },
    {
        "nombre": "subsidio_aprobado",
        "categoria": "utilidad",
        "idioma": "es",
        "contenido": "¡Buenas noticias {{1}}! Tu solicitud de subsidio familiar ha sido APROBADA. El valor de ${{2}} será depositado el {{3}} en la cuenta registrada. Radicado: {{4}}.",
        "variables": ["nombre", "valor_subsidio", "fecha_deposito", "radicado"],
        "estado": "approved",
    },
    {
        "nombre": "promocion_recreacion",
        "categoria": "marketing",
        "idioma": "es",
        "contenido": "{{1}}, ¡no te pierdas nuestros paquetes de recreación para {{2}}! Destinos desde ${{3}} con descuentos exclusivos para afiliados COMFAGUAJIRA. Cupos limitados. Escríbenos para reservar.",
        "variables": ["nombre", "temporada", "precio_desde"],
        "estado": "approved",
    },
    {
        "nombre": "encuesta_satisfaccion",
        "categoria": "utilidad",
        "idioma": "es",
        "contenido": "Hola {{1}}, gracias por contactar a COMFAGUAJIRA. ¿Cómo calificarías la atención recibida hoy? Responde con un número del 1 al 5, donde 5 es excelente. Tu opinión nos ayuda a mejorar.",
        "variables": ["nombre"],
        "estado": "pending",
    },
]

# ---------------------------------------------------------------------------
# Campaigns seed data
# ---------------------------------------------------------------------------

CAMPAIGNS_DATA = [
    {
        "nombre": "Recordatorio de pago — Marzo 2026",
        "tipo": "utilidad",
        "audiencia": {},
        "estado": "completada",
        "enviados_pct": 1.0,
        "leidos_pct": 0.89,
        "respondidos_pct": 0.12,
    },
    {
        "nombre": "Paquetes de Semana Santa — Cartagena y Santa Marta",
        "tipo": "marketing",
        "audiencia": {"tipo_afiliado": "trabajador"},
        "estado": "programada",
        "enviados_pct": 0.0,
        "leidos_pct": 0.0,
        "respondidos_pct": 0.0,
    },
    {
        "nombre": "Cursos de capacitación — Abril 2026",
        "tipo": "utilidad",
        "audiencia": {},
        "estado": "borrador",
        "enviados_pct": 0.0,
        "leidos_pct": 0.0,
        "respondidos_pct": 0.0,
    },
]

# ---------------------------------------------------------------------------
# Flow config seed data
# ---------------------------------------------------------------------------

FLOW_DEFAULT_NODES = [
    {"id": "start", "type": "start", "label": "Inicio", "position": {"x": 100, "y": 200}},
    {"id": "greeting", "type": "message", "label": "Saludo", "position": {"x": 300, "y": 200},
     "data": {"message": "¡Hola! Soy el asistente virtual de COMFAGUAJIRA. ¿En qué puedo ayudarte hoy?"}},
    {"id": "menu", "type": "menu", "label": "Menú principal", "position": {"x": 500, "y": 200},
     "data": {"options": ["Subsidios", "Certificados", "PQRS", "Recreación", "Hablar con asesor"]}},
    {"id": "escalate", "type": "escalate", "label": "Escalar a asesor", "position": {"x": 700, "y": 350},
     "data": {"message": "Te voy a conectar con un asesor. Un momento, por favor."}},
    {"id": "end", "type": "end", "label": "Fin", "position": {"x": 900, "y": 200}},
]

FLOW_DEFAULT_EDGES = [
    {"id": "e1", "source": "start", "target": "greeting"},
    {"id": "e2", "source": "greeting", "target": "menu"},
    {"id": "e3", "source": "menu", "target": "escalate", "label": "Asesor"},
    {"id": "e4", "source": "menu", "target": "end", "label": "Resuelto"},
    {"id": "e5", "source": "escalate", "target": "end"},
]

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def random_cedula() -> str:
    """Generate a realistic Colombian cedula number."""
    return str(random.randint(10_000_000, 99_999_999))


def random_colombian_phone() -> str:
    """Generate a realistic Colombian mobile number."""
    prefixes = ["300", "301", "302", "303", "304", "305", "310", "311",
                "312", "313", "314", "315", "316", "317", "318", "319",
                "320", "321", "322", "323", "324", "350", "3500"]
    prefix = random.choice(prefixes)
    suffix = "".join([str(random.randint(0, 9)) for _ in range(7)])
    return f"+57 {prefix}{suffix}"


def weighted_choice(choices, weights):
    total = sum(weights)
    r = random.uniform(0, total)
    cumulative = 0
    for choice, weight in zip(choices, weights):
        cumulative += weight
        if r <= cumulative:
            return choice
    return choices[-1]


def random_past_datetime(days_back: int = 30) -> datetime:
    offset_seconds = random.randint(0, days_back * 24 * 3600)
    return datetime.utcnow() - timedelta(seconds=offset_seconds)


def build_timeline_events(conv_id: str, intent: str, estado: str, created_at: datetime) -> list[models.DBTimelineEvent]:
    """Build a realistic sequence of timeline events for a conversation."""
    events = []
    t = created_at

    # Every conversation starts with bot
    events.append(models.DBTimelineEvent(
        id=str(uuid.uuid4()),
        conversation_id=conv_id,
        tipo="bot_start",
        descripcion="Bot inició la conversación y saludó al usuario",
        timestamp=t,
    ))
    t += timedelta(seconds=random.randint(2, 15))

    # Intent detected
    events.append(models.DBTimelineEvent(
        id=str(uuid.uuid4()),
        conversation_id=conv_id,
        tipo="intent_detected",
        descripcion=f"Intención detectada: {intent}",
        metadata_={"intent": intent, "confidence": round(random.uniform(0.78, 0.99), 2)},
        timestamp=t,
    ))
    t += timedelta(seconds=random.randint(10, 60))

    if estado in ("escalado", "en_proceso"):
        events.append(models.DBTimelineEvent(
            id=str(uuid.uuid4()),
            conversation_id=conv_id,
            tipo="escalated",
            descripcion="El usuario solicitó hablar con un asesor humano",
            timestamp=t,
        ))
        t += timedelta(seconds=random.randint(30, 180))

        events.append(models.DBTimelineEvent(
            id=str(uuid.uuid4()),
            conversation_id=conv_id,
            tipo="agent_reply",
            descripcion="Asesor tomó la conversación y respondió al usuario",
            timestamp=t,
        ))
        t += timedelta(seconds=random.randint(60, 300))

    if estado == "resuelto":
        if random.random() < 0.3:
            events.append(models.DBTimelineEvent(
                id=str(uuid.uuid4()),
                conversation_id=conv_id,
                tipo="escalated",
                descripcion="Escalado temporal a asesor humano",
                timestamp=t,
            ))
            t += timedelta(seconds=random.randint(60, 240))

        events.append(models.DBTimelineEvent(
            id=str(uuid.uuid4()),
            conversation_id=conv_id,
            tipo="resolved",
            descripcion="Conversación resuelta satisfactoriamente",
            timestamp=t,
        ))

    if random.random() < 0.25:
        events.append(models.DBTimelineEvent(
            id=str(uuid.uuid4()),
            conversation_id=conv_id,
            tipo="note",
            descripcion=random.choice([
                "Usuario requiere seguimiento por parte del área de subsidios",
                "Se envió documentación al correo del afiliado",
                "Caso marcado para revisión del supervisor",
                "Se emitió radicado interno para procesamiento",
                "Afiliado solicita llamada de seguimiento",
            ]),
            timestamp=t + timedelta(seconds=random.randint(10, 120)),
        ))

    return events


def build_messages(conv_id: str, intent: str, created_at: datetime) -> list[models.DBMessage]:
    """Build a realistic message thread from the intent script."""
    script = CONV_SCRIPTS.get(intent, CONV_SCRIPTS["Información general"])
    messages = []
    t = created_at + timedelta(seconds=random.randint(1, 10))
    for role, content in script:
        messages.append(models.DBMessage(
            id=str(uuid.uuid4()),
            conversation_id=conv_id,
            role=role,
            content=content,
            timestamp=t,
        ))
        t += timedelta(seconds=random.randint(5, 90))
    return messages


# ---------------------------------------------------------------------------
# Main seed function
# ---------------------------------------------------------------------------

def seed():
    print("=" * 60)
    print("  COMFAGUAJIRA Chatbot — Database Seeder")
    print("=" * 60)

    # Create all tables
    models.Base.metadata.create_all(bind=engine)
    print("[1/13] Tables created (or already exist).")

    db = SessionLocal()

    try:
        # ------------------------------------------------------------------
        # 1. Agents
        # ------------------------------------------------------------------
        existing_agents = db.query(models.DBAgent).count()
        agents = []
        if existing_agents == 0:
            hashed = hash_password("demo1234")
            for agent_data in AGENTS_DATA:
                agent = models.DBAgent(
                    id=str(uuid.uuid4()),
                    nombre=agent_data["nombre"],
                    email=agent_data["email"],
                    hashed_password=hashed,
                    rol=agent_data.get("rol", "asesor"),
                    activo=True,
                )
                db.add(agent)
                agents.append(agent)
            db.commit()
            print(f"[2/13] Inserted {len(agents)} agents.")
        else:
            agents = db.query(models.DBAgent).all()
            print(f"[2/13] Agents already exist ({len(agents)}), skipping.")

        # ------------------------------------------------------------------
        # 2. Users (afiliados)
        # ------------------------------------------------------------------
        existing_users = db.query(models.DBUser).count()
        users = []
        if existing_users == 0:
            used_cedulas: set[str] = set()
            for _ in range(50):
                cedula = random_cedula()
                while cedula in used_cedulas:
                    cedula = random_cedula()
                used_cedulas.add(cedula)

                nombre = random.choice(NOMBRES)
                apellido = random.choice(APELLIDOS)
                user = models.DBUser(
                    id=str(uuid.uuid4()),
                    cedula=cedula,
                    nombre=nombre,
                    apellido=apellido,
                    telefono=random_colombian_phone(),
                    email=f"{nombre.lower()}.{apellido.lower()}{random.randint(1,99)}@gmail.com",
                    tipo_afiliado=weighted_choice(TIPOS_AFILIADO, TIPOS_AFILIADO_WEIGHTS),
                    activo=True,
                )
                db.add(user)
                users.append(user)
            db.commit()
            print(f"[3/13] Inserted {len(users)} users (afiliados).")
        else:
            users = db.query(models.DBUser).all()
            print(f"[3/13] Users already exist ({len(users)}), skipping.")

        # ------------------------------------------------------------------
        # 3. Intents catalog
        # ------------------------------------------------------------------
        existing_intents = db.query(models.DBIntent).count()
        if existing_intents == 0:
            for intent_name in INTENTS:
                intent_obj = models.DBIntent(
                    id=str(uuid.uuid4()),
                    nombre=intent_name,
                    descripcion=f"Consultas relacionadas con {intent_name.lower()} de COMFAGUAJIRA",
                    ejemplos=INTENT_EXAMPLES.get(intent_name, []),
                )
                db.add(intent_obj)
            db.commit()
            print(f"[4/13] Inserted {len(INTENTS)} intents.")
        else:
            print(f"[4/13] Intents already exist, skipping.")

        # ------------------------------------------------------------------
        # 4. Conversations, messages, timeline events, tickets
        # ------------------------------------------------------------------
        existing_convs = db.query(models.DBConversation).count()
        if existing_convs == 0:
            conv_count = 0
            msg_count = 0
            event_count = 0
            ticket_count = 0

            for i in range(100):
                intent = weighted_choice(INTENTS, INTENT_WEIGHTS)
                canal = weighted_choice(CHANNELS, CHANNEL_WEIGHTS)
                estado = weighted_choice(STATUSES, STATUS_WEIGHTS)
                sentimiento = weighted_choice(SENTIMENTS, SENTIMENT_WEIGHTS)
                created_at = random_past_datetime(45)

                # Assign user — 85% have a registered user, 15% anonymous
                user = random.choice(users) if random.random() < 0.85 else None

                # Assign agent only for escalated / en_proceso
                agent = None
                if estado in ("escalado", "en_proceso", "resuelto") and random.random() < 0.7:
                    agent = random.choice(agents)

                resolved_at = None
                if estado == "resuelto":
                    resolved_at = created_at + timedelta(minutes=random.randint(3, 60))

                last_message_offset = timedelta(seconds=random.randint(30, 600))
                last_message_at = created_at + last_message_offset

                conv_id = str(uuid.uuid4())
                conv = models.DBConversation(
                    id=conv_id,
                    user_id=user.id if user else None,
                    agent_id=agent.id if agent else None,
                    canal=canal,
                    estado=estado,
                    intent=intent,
                    sentimiento=sentimiento,
                    created_at=created_at,
                    last_message_at=last_message_at,
                    resolved_at=resolved_at,
                )
                db.add(conv)
                conv_count += 1

                # Messages
                for msg in build_messages(conv_id, intent, created_at):
                    db.add(msg)
                    msg_count += 1

                # Timeline events
                for event in build_timeline_events(conv_id, intent, estado, created_at):
                    db.add(event)
                    event_count += 1

                # Tickets — only for PQRS intent or ~20% chance otherwise
                if intent == "PQRS" or (random.random() < 0.20):
                    tipo_ticket = "PQRS" if intent == "PQRS" else random.choice(["solicitud", "queja", "reclamo"])
                    ticket_estado = random.choice(["abierto", "en_revision", "cerrado"])
                    ticket = models.DBTicket(
                        id=str(uuid.uuid4()),
                        conversation_id=conv_id,
                        tipo=tipo_ticket,
                        descripcion=f"Ticket generado automáticamente para la conversación {conv_id[:8]}. Intención: {intent}.",
                        estado=ticket_estado,
                        created_at=created_at + timedelta(seconds=random.randint(60, 300)),
                    )
                    db.add(ticket)
                    ticket_count += 1

                # Commit every 20 conversations to avoid large transactions
                if (i + 1) % 20 == 0:
                    db.commit()

            db.commit()
            print(f"[5/13] Inserted {conv_count} conversations, {msg_count} messages, "
                  f"{event_count} timeline events, {ticket_count} tickets.")
        else:
            print(f"[5/13] Conversations already exist ({existing_convs}), skipping.")

        # ------------------------------------------------------------------
        # 5. Metrics snapshots — 30 days × 4 channels
        # ------------------------------------------------------------------
        existing_snaps = db.query(models.DBMetricsSnapshot).count()
        if existing_snaps == 0:
            snap_count = 0
            base_counts = {
                "web": (100, 15),        # (avg_daily, std)
                "whatsapp": (175, 25),
                "instagram": (75, 12),
                "tiktok": (45, 8),
            }
            for day_offset in range(30):
                fecha = datetime.utcnow() - timedelta(days=30 - day_offset)
                for canal, (avg, std) in base_counts.items():
                    total = max(10, int(random.gauss(avg, std)))
                    automatizadas = int(total * random.uniform(0.68, 0.80))
                    escaladas = int(total * random.uniform(0.15, 0.25))
                    resueltas = automatizadas + int(escaladas * random.uniform(0.5, 0.9))
                    satisfaccion = round(random.uniform(85.0, 97.0), 1)
                    tiempo_promedio = round(random.uniform(28.0, 55.0), 1)
                    snap = models.DBMetricsSnapshot(
                        id=str(uuid.uuid4()),
                        fecha=fecha,
                        canal=canal,
                        conversaciones=total,
                        automatizadas=automatizadas,
                        escaladas=escaladas,
                        resueltas=resueltas,
                        satisfaccion=satisfaccion,
                        tiempo_promedio_seg=tiempo_promedio,
                    )
                    db.add(snap)
                    snap_count += 1
            db.commit()
            print(f"[6/13] Inserted {snap_count} metrics snapshots (30 days × 4 channels).")
        else:
            print(f"[6/13] Metrics snapshots already exist ({existing_snaps}), skipping.")

        # ------------------------------------------------------------------
        # 6. Pricing catalog
        # ------------------------------------------------------------------
        existing_pricing = db.query(models.DBPricingCatalog).count()
        if existing_pricing == 0:
            for item in PRICING_DATA:
                pricing_obj = models.DBPricingCatalog(
                    id=str(uuid.uuid4()),
                    tipo=item["tipo"],
                    nombre=item["nombre"],
                    precio=item.get("precio"),
                    moneda=item.get("moneda", "COP"),
                    descripcion=item.get("descripcion"),
                    metadata_=item.get("metadata_"),
                    activo=True,
                )
                db.add(pricing_obj)
            db.commit()
            print(f"[7/13] Inserted {len(PRICING_DATA)} pricing catalog entries.")
        else:
            print(f"[7/13] Pricing catalog already exists ({existing_pricing}), skipping.")

        # ------------------------------------------------------------------
        # 7. Notifications
        # ------------------------------------------------------------------
        existing_notifs = db.query(models.DBNotification).count()
        if existing_notifs == 0:
            admin_agent = agents[0] if agents else None
            notifications_data = [
                # Broadcast notifications (agent_id=None — visible to all)
                {
                    "tipo": "info",
                    "titulo": "Bienvenido a COMFAGUAJIRA Chatbot v2.0",
                    "mensaje": "Se han habilitado nuevas funcionalidades: gestión de asesores, afiliados y canal WhatsApp.",
                    "agent_id": None,
                    "leida": False,
                },
                {
                    "tipo": "success",
                    "titulo": "Integración WhatsApp lista",
                    "mensaje": "El webhook de WhatsApp Cloud API está configurado en modo simulación. Configure las credenciales en .env para modo producción.",
                    "agent_id": None,
                    "leida": False,
                },
                {
                    "tipo": "warning",
                    "titulo": "Conversaciones sin resolver",
                    "mensaje": "Hay más de 15 conversaciones en estado 'nuevo' sin atender. Revisa el inbox.",
                    "agent_id": None,
                    "leida": False,
                },
                {
                    "tipo": "info",
                    "titulo": "Mantenimiento programado",
                    "mensaje": "El sistema tendrá mantenimiento el próximo domingo de 2am a 4am. Los servicios estarán en modo reducido.",
                    "agent_id": None,
                    "leida": True,
                },
                {
                    "tipo": "success",
                    "titulo": "Reporte mensual generado",
                    "mensaje": "El reporte de métricas de febrero 2026 está disponible en el módulo de métricas.",
                    "agent_id": None,
                    "leida": True,
                },
                # Personal notifications for admin agent
                {
                    "tipo": "info",
                    "titulo": "Nuevo asesor pendiente de activación",
                    "mensaje": "Se ha registrado un nuevo asesor. Revisa el panel de administración para activarlo.",
                    "agent_id": admin_agent.id if admin_agent else None,
                    "leida": False,
                },
                {
                    "tipo": "warning",
                    "titulo": "Límite de conversaciones al 80%",
                    "mensaje": "El plan actual ha consumido el 80% de las conversaciones incluidas este mes. Considera ampliar el plan.",
                    "agent_id": admin_agent.id if admin_agent else None,
                    "leida": False,
                },
                {
                    "tipo": "error",
                    "titulo": "Error en envío WhatsApp",
                    "mensaje": "Fallaron 3 envíos automáticos de WhatsApp en las últimas 2 horas. Revisa las credenciales de la API.",
                    "agent_id": admin_agent.id if admin_agent else None,
                    "leida": False,
                },
                {
                    "tipo": "success",
                    "titulo": "Backup completado",
                    "mensaje": "El respaldo automático de la base de datos se completó exitosamente.",
                    "agent_id": admin_agent.id if admin_agent else None,
                    "leida": True,
                },
                {
                    "tipo": "info",
                    "titulo": "Actualización de intenciones disponible",
                    "mensaje": "Se han detectado nuevos patrones de consulta. Considera actualizar el catálogo de intenciones.",
                    "agent_id": admin_agent.id if admin_agent else None,
                    "leida": True,
                },
            ]
            notif_count = 0
            for n in notifications_data:
                notif = models.DBNotification(
                    id=str(uuid.uuid4()),
                    agent_id=n["agent_id"],
                    tipo=n["tipo"],
                    titulo=n["titulo"],
                    mensaje=n["mensaje"],
                    leida=n["leida"],
                )
                db.add(notif)
                notif_count += 1
            db.commit()
            print(f"[8/13] Inserted {notif_count} notifications.")
        else:
            print(f"[8/13] Notifications already exist ({existing_notifs}), skipping.")

        # ------------------------------------------------------------------
        # 8. Organization
        # ------------------------------------------------------------------
        existing_orgs = db.query(models.DBOrganization).count()
        if existing_orgs == 0:
            org = models.DBOrganization(
                id=str(uuid.uuid4()),
                nombre="COMFAGUAJIRA",
                nit="800.123.456-7",
                plan="profesional",
                activo=True,
                configuracion={
                    "slaMinutos": 30,
                    "autoEscalarMinutos": 10,
                    "horario": {
                        "lunes_viernes": "07:30-17:30",
                        "sabados": "08:00-12:00",
                    },
                    "canales": ["whatsapp", "web", "instagram"],
                    "sede_principal": "Riohacha, La Guajira",
                },
            )
            db.add(org)
            db.commit()
            print("[9/13] Inserted 1 organization (COMFAGUAJIRA).")
        else:
            print(f"[9/13] Organizations already exist ({existing_orgs}), skipping.")

        # ------------------------------------------------------------------
        # 9. KB Articles
        # ------------------------------------------------------------------
        existing_kb = db.query(models.DBKBArticle).count()
        if existing_kb == 0:
            for art_data in KB_ARTICLES_DATA:
                article = models.DBKBArticle(
                    id=str(uuid.uuid4()),
                    titulo=art_data["titulo"],
                    categoria=art_data["categoria"],
                    contenido=art_data["contenido"],
                    tags=art_data["tags"],
                    activo=True,
                    visitas=random.randint(10, 250),
                )
                db.add(article)
            db.commit()
            print(f"[10/13] Inserted {len(KB_ARTICLES_DATA)} KB articles.")
        else:
            print(f"[10/13] KB articles already exist ({existing_kb}), skipping.")

        # ------------------------------------------------------------------
        # 10. Templates
        # ------------------------------------------------------------------
        existing_templates = db.query(models.DBTemplate).count()
        if existing_templates == 0:
            for tmpl_data in TEMPLATES_DATA:
                tmpl = models.DBTemplate(
                    id=str(uuid.uuid4()),
                    nombre=tmpl_data["nombre"],
                    categoria=tmpl_data["categoria"],
                    idioma=tmpl_data["idioma"],
                    contenido=tmpl_data["contenido"],
                    variables=tmpl_data["variables"],
                    estado=tmpl_data["estado"],
                )
                db.add(tmpl)
            db.commit()
            print(f"[11/13] Inserted {len(TEMPLATES_DATA)} message templates.")
        else:
            print(f"[11/13] Templates already exist ({existing_templates}), skipping.")

        # ------------------------------------------------------------------
        # 11. Campaigns
        # ------------------------------------------------------------------
        existing_campaigns = db.query(models.DBCampaign).count()
        if existing_campaigns == 0:
            total_users = db.query(models.DBUser).filter(models.DBUser.activo == True).count()
            for camp_data in CAMPAIGNS_DATA:
                # Compute audience size
                if camp_data["audiencia"].get("tipo_afiliado"):
                    audience_total = db.query(models.DBUser).filter(
                        models.DBUser.activo == True,
                        models.DBUser.tipo_afiliado == camp_data["audiencia"]["tipo_afiliado"],
                    ).count()
                else:
                    audience_total = total_users

                enviados = int(audience_total * camp_data["enviados_pct"])
                leidos = int(audience_total * camp_data["leidos_pct"])
                respondidos = int(audience_total * camp_data["respondidos_pct"])

                completed_at = None
                if camp_data["estado"] == "completada":
                    completed_at = datetime.utcnow() - timedelta(days=random.randint(1, 7))

                campaign = models.DBCampaign(
                    id=str(uuid.uuid4()),
                    nombre=camp_data["nombre"],
                    tipo=camp_data["tipo"],
                    audiencia=camp_data["audiencia"],
                    estado=camp_data["estado"],
                    total=audience_total,
                    enviados=enviados,
                    leidos=leidos,
                    respondidos=respondidos,
                    completed_at=completed_at,
                )
                db.add(campaign)
            db.commit()
            print(f"[12/13] Inserted {len(CAMPAIGNS_DATA)} campaigns.")
        else:
            print(f"[12/13] Campaigns already exist ({existing_campaigns}), skipping.")

        # ------------------------------------------------------------------
        # 12. Flow config
        # ------------------------------------------------------------------
        existing_flows = db.query(models.DBFlowConfig).count()
        if existing_flows == 0:
            flow = models.DBFlowConfig(
                id=str(uuid.uuid4()),
                nombre="Flujo principal WhatsApp",
                descripcion="Flujo de atención estándar para el canal WhatsApp con menú principal y escalado a asesor",
                canal="whatsapp",
                activo=True,
                nodes=FLOW_DEFAULT_NODES,
                edges=FLOW_DEFAULT_EDGES,
            )
            db.add(flow)
            db.commit()
            print("[13/13] Inserted 1 flow config (Flujo principal WhatsApp).")
        else:
            print(f"[13/13] Flow configs already exist ({existing_flows}), skipping.")

        # ------------------------------------------------------------------
        # Step 14: QA Scores for resolved conversations
        # ------------------------------------------------------------------
        if db.query(DBQAScore).count() == 0:
            from app.ai_service import calculate_qa_score
            resolved = db.query(DBConversation).filter(DBConversation.estado == 'resuelto').all()
            for conv in resolved:
                # Load timeline for the conversation
                timeline_events = db.query(DBTimelineEvent).filter(DBTimelineEvent.conversation_id == conv.id).all()
                conv.timeline = timeline_events
                scores = calculate_qa_score(conv, [])
                qa = DBQAScore(
                    id=str(uuid.uuid4()),
                    conversation_id=conv.id,
                    **scores,
                )
                db.add(qa)
            db.commit()
            print(f"  ✓ QA scores generados para {len(resolved)} conversaciones resueltas")

    except Exception as exc:
        db.rollback()
        print(f"\nERROR during seeding: {exc}")
        raise
    finally:
        db.close()

    print("\n" + "=" * 60)
    print("  Seed complete. Demo credentials:")
    for a in AGENTS_DATA:
        print(f"    {a['email']}  /  demo1234")
    print("=" * 60)


if __name__ == "__main__":
    seed()
