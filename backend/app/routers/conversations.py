from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from app.database import get_db
from app import models, schemas
from app.deps import get_current_agent
from datetime import datetime

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("", response_model=List[schemas.ConversationListItem])
def list_conversations(
    canal: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(models.DBConversation).options(
        joinedload(models.DBConversation.user),
        joinedload(models.DBConversation.agent),
    )
    if canal:
        q = q.filter(models.DBConversation.canal == canal)
    if estado:
        q = q.filter(models.DBConversation.estado == estado)
    convs = q.order_by(models.DBConversation.last_message_at.desc()).limit(100).all()
    result = []
    for c in convs:
        item = schemas.ConversationListItem(
            id=c.id,
            canal=c.canal,
            estado=c.estado,
            intent=c.intent,
            sentimiento=c.sentimiento,
            last_message_at=c.last_message_at,
            created_at=c.created_at,
            user=schemas.UserOut.model_validate(c.user) if c.user else None,
            agent_nombre=c.agent.nombre if c.agent else None,
        )
        result.append(item)
    return result


@router.get("/{conv_id}", response_model=schemas.ConversationDetail)
def get_conversation(conv_id: str, db: Session = Depends(get_db)):
    c = db.query(models.DBConversation).options(
        joinedload(models.DBConversation.user),
        joinedload(models.DBConversation.agent),
        joinedload(models.DBConversation.messages),
        joinedload(models.DBConversation.timeline),
    ).filter(models.DBConversation.id == conv_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    return schemas.ConversationDetail(
        id=c.id,
        canal=c.canal,
        estado=c.estado,
        intent=c.intent,
        sentimiento=c.sentimiento,
        last_message_at=c.last_message_at,
        created_at=c.created_at,
        user=schemas.UserOut.model_validate(c.user) if c.user else None,
        agent_nombre=c.agent.nombre if c.agent else None,
        messages=[schemas.MessageOut.model_validate(m) for m in c.messages],
        timeline=[schemas.TimelineEventOut.model_validate(e) for e in c.timeline],
    )


@router.post("/{conv_id}/messages")
def send_message(conv_id: str, req: schemas.SendMessageRequest, db: Session = Depends(get_db)):
    conv = db.query(models.DBConversation).filter(models.DBConversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    msg = models.DBMessage(conversation_id=conv_id, role=req.role, content=req.content)
    conv.last_message_at = datetime.utcnow()
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"id": msg.id, "role": msg.role, "content": msg.content, "timestamp": msg.timestamp}


@router.post("/{conv_id}/escalate")
def escalate_conversation(conv_id: str, db: Session = Depends(get_db)):
    conv = db.query(models.DBConversation).filter(models.DBConversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    conv.estado = "escalado"
    event = models.DBTimelineEvent(
        conversation_id=conv_id,
        tipo="escalated",
        descripcion="Escalado a asesor humano desde el inbox",
    )
    db.add(event)
    db.commit()
    return {"status": "escalado", "conversation_id": conv_id}


@router.post("/{conv_id}/resolve")
def resolve_conversation(conv_id: str, db: Session = Depends(get_db)):
    conv = db.query(models.DBConversation).filter(models.DBConversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    conv.estado = "resuelto"
    conv.resolved_at = datetime.utcnow()
    event = models.DBTimelineEvent(
        conversation_id=conv_id,
        tipo="resolved",
        descripcion="Conversación marcada como resuelta",
    )
    db.add(event)
    db.commit()
    return {"status": "resuelto", "conversation_id": conv_id}
