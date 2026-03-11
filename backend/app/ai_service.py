import os
import random
from typing import List, Optional

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Copilot suggestions by intent
COPILOT_SUGGESTIONS = {
    "Subsidio familiar": [
        "Puedo verificar el estado de tu subsidio ahora mismo. ¿Me confirmas tu número de cédula?",
        "Tu subsidio familiar se paga el día 15 de cada mes. ¿Deseas que consulte el estado de tu pago?",
        "Para consultar tu subsidio necesito validar tu identidad. ¿Cuál es tu número de cédula?",
    ],
    "Certificado de afiliación": [
        "Genero tu certificado de afiliación inmediatamente. Dame tu número de cédula.",
        "El certificado puede descargarse por nuestro portal o puedo enviártelo aquí. ¿Cuál prefieres?",
        "Tu certificado tiene vigencia de 30 días. ¿Lo necesitas en PDF?",
    ],
    "PQRS": [
        "Entiendo tu situación. Voy a registrar tu PQRS de inmediato. ¿Me describes brevemente el motivo?",
        "Tu caso merece atención prioritaria. Procedo a radicar una PQRS y te asigno un número de seguimiento.",
        "Lamento los inconvenientes. Para radicar tu PQRS necesito el motivo y tu número de cédula.",
    ],
    "Recreación y turismo": [
        "Tenemos excelentes paquetes con descuentos hasta el 50% para afiliados. ¿Qué destino te interesa?",
        "Los paquetes de recreación incluyen seguro de viaje y transporte desde Riohacha. ¿Te envío el catálogo?",
        "Para reservar necesitas estar al día con tus aportes. ¿Verifico tu estado de afiliación?",
    ],
    "default": [
        "Entiendo tu consulta. Permíteme verificar la información en nuestros sistemas.",
        "Puedo ayudarte con eso. ¿Me das más detalles sobre tu solicitud?",
        "Estoy revisando tu caso. Un momento, por favor.",
    ],
}

# Summary templates
SUMMARY_TEMPLATES = [
    "El afiliado consultó sobre {intent}. {resolution_text} El proceso tomó {minutes} minutos.",
    "Consulta de {intent}: {resolution_text} Se gestionó en {minutes} minutos.",
    "Atención por {intent}. {resolution_text} Tiempo de gestión: {minutes} min.",
]

RESOLUTION_TEXTS = {
    "resuelto": "Se resolvió satisfactoriamente sin escalar.",
    "escalado": "Se escaló a asesor especializado para mayor atención.",
    "pendiente": "Queda pendiente de seguimiento.",
}


async def get_copilot_suggestions(intent: Optional[str], last_messages: List[str]) -> List[str]:
    """Get AI-powered response suggestions for the agent."""
    if OPENAI_API_KEY:
        try:
            import openai
            client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
            context = "\n".join(last_messages[-5:]) if last_messages else ""
            prompt = f"""Eres un asistente de COMFAGUAJIRA (caja de compensación familiar).
El cliente tiene la intención: {intent or 'desconocida'}.
Últimos mensajes del chat:
{context}

Genera 3 respuestas cortas y empáticas (máx 120 caracteres cada una) que un asesor podría usar.
Formato: una respuesta por línea, sin numeración."""

            resp = await client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
                temperature=0.7,
            )
            suggestions = [s.strip() for s in resp.choices[0].message.content.strip().split("\n") if s.strip()]
            return suggestions[:3]
        except Exception:
            pass  # Fall through to mock

    # Mock response
    key = intent if intent in COPILOT_SUGGESTIONS else "default"
    suggestions = COPILOT_SUGGESTIONS[key].copy()
    random.shuffle(suggestions)
    return suggestions[:3]


async def summarize_conversation(messages: List[dict], intent: str, estado: str) -> dict:
    """Generate a conversation summary."""
    if OPENAI_API_KEY:
        try:
            import openai
            client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
            conv_text = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in messages])
            prompt = f"""Resume esta conversación de atención al cliente en español.
Intención: {intent}
Estado final: {estado}

Conversación:
{conv_text}

Responde en JSON con:
- resumen: string (2-3 oraciones)
- intent_principal: string
- resolucion: "resuelto" | "escalado" | "pendiente"
- entidades: dict con cedula, tramite, monto si los hay"""

            resp = await client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=400,
                temperature=0.3,
                response_format={"type": "json_object"},
            )
            import json
            return json.loads(resp.choices[0].message.content)
        except Exception:
            pass

    # Mock summary
    minutes = random.randint(2, 12)
    resolution_text = RESOLUTION_TEXTS.get(estado, RESOLUTION_TEXTS["resuelto"])
    template = random.choice(SUMMARY_TEMPLATES)
    resumen = template.format(intent=intent or "consulta general", resolution_text=resolution_text, minutes=minutes)
    return {
        "resumen": resumen,
        "intent_principal": intent or "Información general",
        "resolucion": estado if estado in RESOLUTION_TEXTS else "resuelto",
        "entidades": {},
    }


def search_kb_mock(query: str, articles: list, top_k: int = 3) -> List[dict]:
    """Simple keyword search over KB articles (simulates vector search)."""
    query_lower = query.lower()
    results = []
    for art in articles:
        score = 0.0
        if any(w in art.titulo.lower() for w in query_lower.split()):
            score += 0.5
        if any(w in art.contenido.lower() for w in query_lower.split()):
            score += 0.3
        if hasattr(art, 'tags') and art.tags:
            if any(t in query_lower for t in (art.tags or [])):
                score += 0.2
        if score > 0:
            results.append({
                "id": art.id,
                "titulo": art.titulo,
                "categoria": art.categoria,
                "snippet": art.contenido[:200].replace("\n", " ") + "...",
                "score": min(score, 1.0),
            })
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]


def calculate_qa_score(conversation, messages: list) -> dict:
    """Calculate QA score for a conversation (0-100)."""
    # Load timeline safely
    timeline = []
    try:
        timeline = conversation.timeline or []
    except Exception:
        timeline = []

    # Intent resolved (0-30): resolved without escalation = 30, resolved with escalation = 20, escalated = 15
    if conversation.estado == "resuelto" and not any(
        e.tipo == "escalated" for e in timeline
    ):
        intent_resolved = 30
    elif conversation.estado == "resuelto":
        intent_resolved = 20
    else:
        intent_resolved = 15

    # Time score (0-20): based on conversation duration
    from datetime import datetime, timezone
    created = conversation.created_at
    now = conversation.resolved_at or datetime.now(timezone.utc)
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    duration_min = (now - created).total_seconds() / 60
    if duration_min < 2:
        time_score = 20
    elif duration_min < 5:
        time_score = 16
    elif duration_min < 10:
        time_score = 12
    else:
        time_score = 8

    # Sentiment score (0-20)
    sentiment_map = {"positivo": 20, "neutro": 14, "negativo": 6}
    sentiment_score = sentiment_map.get(conversation.sentimiento, 14)

    # No unnecessary escalation (0-15)
    escalated = any(e.tipo == "escalated" for e in timeline)
    no_escalation_score = 8 if escalated else 15

    # Protocol score (0-15): has intro (bot_start) and resolution (resolved)
    has_start = any(e.tipo == "bot_start" for e in timeline)
    has_end = any(e.tipo in ["resolved", "agent_reply"] for e in timeline)
    protocol_score = 15 if (has_start and has_end) else 10

    total = intent_resolved + time_score + sentiment_score + no_escalation_score + protocol_score
    return {
        "score_total": total,
        "intent_resolved": intent_resolved,
        "time_score": time_score,
        "sentiment_score": sentiment_score,
        "no_escalation_score": no_escalation_score,
        "protocol_score": protocol_score,
    }


async def route_conversation(conversation, available_agents: list) -> dict:
    """Smart routing: assign the best available agent."""
    if not available_agents:
        return {"agent_id": None, "agent_nombre": None, "reason": "No hay asesores disponibles", "score": 0.0}

    # Simple scoring: prefer agents with fewer active conversations
    # In a real system, this would consider: skills, load, language, specialization
    best = available_agents[0]
    return {
        "agent_id": best.id,
        "agent_nombre": best.nombre,
        "reason": f"Asignado por disponibilidad y especialización en {conversation.intent or 'consultas generales'}",
        "score": 0.85,
    }
