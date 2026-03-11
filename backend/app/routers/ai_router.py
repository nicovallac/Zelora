from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app import models, schemas
from app.deps import get_current_agent
from app.ai_service import get_copilot_suggestions, summarize_conversation, search_kb_mock, calculate_qa_score, route_conversation
import uuid

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/copilot", response_model=schemas.CopilotResponse)
async def copilot(
    data: schemas.CopilotRequest,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    conv = db.query(models.DBConversation).filter(models.DBConversation.id == data.conversation_id).first()
    intent = data.intent or (conv.intent if conv else None)
    suggestions = await get_copilot_suggestions(intent, data.last_messages)
    return schemas.CopilotResponse(
        suggestions=suggestions,
        intent_detected=intent,
        confidence=0.87,
    )


@router.post("/summarize", response_model=schemas.SummarizeResponse)
async def summarize(
    data: schemas.SummarizeRequest,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    conv = db.query(models.DBConversation).filter(models.DBConversation.id == data.conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    result = await summarize_conversation(data.messages, conv.intent or "Información general", conv.estado)
    return schemas.SummarizeResponse(**result)


@router.post("/search-kb", response_model=List[schemas.KBSearchResult])
async def search_kb(
    data: schemas.SearchKBRequest,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    articles = db.query(models.DBKBArticle).filter(models.DBKBArticle.activo == True).all()
    results = search_kb_mock(data.query, articles, data.top_k)
    return [schemas.KBSearchResult(**r) for r in results]


@router.post("/qa-score/{conversation_id}", response_model=schemas.QAScoreOut)
def generate_qa_score(
    conversation_id: str,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    conv = db.query(models.DBConversation).options(
        joinedload(models.DBConversation.timeline)
    ).filter(models.DBConversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")

    # Check if score already exists
    existing = db.query(models.DBQAScore).filter(models.DBQAScore.conversation_id == conversation_id).first()
    if existing:
        return existing

    scores = calculate_qa_score(conv, [])
    qa = models.DBQAScore(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        **scores,
    )
    db.add(qa)
    db.commit()
    db.refresh(qa)
    return qa


@router.get("/route/{conversation_id}", response_model=schemas.RoutingDecision)
async def smart_route(
    conversation_id: str,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    conv = db.query(models.DBConversation).filter(models.DBConversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    available_agents = db.query(models.DBAgent).filter(models.DBAgent.activo == True).all()
    decision = await route_conversation(conv, available_agents)
    return schemas.RoutingDecision(**decision)
