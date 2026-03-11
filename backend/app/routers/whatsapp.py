import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app import models, schemas
from app.whatsapp_client import whatsapp_client, get_auto_reply
from app.deps import get_current_agent

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])
VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "comfaguajira_verify_2026")


def gen_id():
    return str(uuid.uuid4())


# ── Webhook verification (GET) ──────────────────────────────────────────────
@router.get("/webhook", tags=["webhook"])
def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed")


# ── Receive messages (POST) ─────────────────────────────────────────────────
@router.post("/webhook", tags=["webhook"])
async def receive_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.json()

    try:
        entry = body.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])
        contacts = value.get("contacts", [])

        for msg in messages:
            from_phone = msg.get("from", "")
            msg_text = msg.get("text", {}).get("body", "") if msg.get("type") == "text" else "[Archivo adjunto]"
            wa_msg_id = msg.get("id", "")

            # Get contact name
            contact_name = ""
            if contacts:
                profile = contacts[0].get("profile", {})
                contact_name = profile.get("name", "")

            # Find or create user
            user = db.query(models.DBUser).filter(models.DBUser.telefono == from_phone).first()
            if not user:
                nombre_parts = contact_name.split(" ", 1) if contact_name else ["Usuario", "WhatsApp"]
                user = models.DBUser(
                    id=gen_id(),
                    cedula=f"WA-{from_phone[-7:]}",
                    nombre=nombre_parts[0],
                    apellido=nombre_parts[1] if len(nombre_parts) > 1 else "WhatsApp",
                    telefono=from_phone,
                    activo=True,
                )
                db.add(user)
                db.flush()

            # Find or create active conversation for this phone
            conv = db.query(models.DBConversation).filter(
                models.DBConversation.user_id == user.id,
                models.DBConversation.canal == "whatsapp",
                models.DBConversation.estado != "resuelto",
            ).order_by(models.DBConversation.created_at.desc()).first()

            if not conv:
                conv = models.DBConversation(
                    id=gen_id(),
                    user_id=user.id,
                    canal="whatsapp",
                    estado="nuevo",
                    sentimiento="neutro",
                )
                db.add(conv)
                db.flush()

                # Timeline: bot start
                db.add(models.DBTimelineEvent(
                    id=gen_id(),
                    conversation_id=conv.id,
                    tipo="bot_start",
                    descripcion="Conversación iniciada desde WhatsApp",
                ))

            # Save user message
            user_msg = models.DBMessage(
                id=gen_id(),
                conversation_id=conv.id,
                role="user",
                content=msg_text,
            )
            db.add(user_msg)
            conv.last_message_at = datetime.utcnow()
            conv.estado = "en_proceso"

            # Detect simple intent
            text_lower = msg_text.lower()
            if any(w in text_lower for w in ['subsidio', 'pago']):
                conv.intent = "Subsidio familiar"
            elif any(w in text_lower for w in ['certificado', 'constancia']):
                conv.intent = "Certificado de afiliación"
            elif any(w in text_lower for w in ['pqrs', 'queja', 'reclamo']):
                conv.intent = "PQRS"
                conv.sentimiento = "negativo"
                db.add(models.DBTimelineEvent(
                    id=gen_id(),
                    conversation_id=conv.id,
                    tipo="intent_detected",
                    descripcion="Intención: PQRS — Sentimiento negativo detectado",
                ))
            elif any(w in text_lower for w in ['recreacion', 'turismo']):
                conv.intent = "Recreación y turismo"

            # Auto-reply
            auto_reply = get_auto_reply(msg_text)
            bot_msg = models.DBMessage(
                id=gen_id(),
                conversation_id=conv.id,
                role="bot",
                content=auto_reply,
            )
            db.add(bot_msg)

            db.commit()

            # Send reply via WhatsApp API
            try:
                await whatsapp_client.send_text_message(from_phone, auto_reply)
            except Exception:
                pass  # Don't fail if WhatsApp send fails

    except Exception as e:
        # Log but don't return error to Meta (they'd retry)
        print(f"Webhook processing error: {e}")

    return {"status": "ok"}


# ── Send message ─────────────────────────────────────────────────────────────
@router.post("/send", response_model=schemas.WhatsAppSendResponse)
async def send_whatsapp_message(
    data: schemas.WhatsAppSendRequest,
    db: Session = Depends(get_db),
    agent: models.DBAgent = Depends(get_current_agent),
):
    try:
        result = await whatsapp_client.send_text_message(data.to, data.message)
        return schemas.WhatsAppSendResponse(success=True, message_id=result.get("message_id"))
    except Exception as e:
        return schemas.WhatsAppSendResponse(success=False, error=str(e))


# ── Get webhook status ────────────────────────────────────────────────────────
@router.get("/status", tags=["whatsapp"])
def whatsapp_status(_agent: models.DBAgent = Depends(get_current_agent)):
    return {
        "configured": whatsapp_client.is_configured(),
        "phone_number_id": os.getenv("WHATSAPP_PHONE_NUMBER_ID", "NOT SET"),
        "verify_token": VERIFY_TOKEN,
        "webhook_url": "https://YOUR_DOMAIN/whatsapp/webhook",
        "mode": "live" if whatsapp_client.is_configured() else "simulation",
    }
