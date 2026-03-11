from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app import models
from app.deps import get_current_agent, get_current_admin

router = APIRouter(prefix="/settings", tags=["settings"])


class NotificationSettings(BaseModel):
    event: str
    email: bool = True
    whatsapp: bool = False
    browser: bool = True


class AISettings(BaseModel):
    provider: str = "openai"
    model_copilot: str = "gpt-4o"
    model_summary: str = "gpt-3.5-turbo"
    temperature: float = 0.7
    max_tokens: int = 500
    confidence_threshold: float = 0.75
    copilot_suggestions: int = 3
    sentiment_analysis: bool = True
    auto_summary: bool = True
    qa_scoring: bool = True


class GeneralSettings(BaseModel):
    language: str = "es"
    timezone: str = "America/Bogota"
    date_format: str = "DD/MM/YYYY"
    session_timeout_minutes: int = 480


@router.get("/general")
def get_general_settings(_agent: models.DBAgent = Depends(get_current_agent)):
    return {
        "language": "es",
        "timezone": "America/Bogota",
        "date_format": "DD/MM/YYYY",
        "session_timeout_minutes": 480,
    }


@router.put("/general")
def update_general_settings(
    data: GeneralSettings,
    _admin: models.DBAgent = Depends(get_current_admin),
):
    return {"status": "updated", **data.model_dump()}


@router.get("/notifications")
def get_notification_settings(_agent: models.DBAgent = Depends(get_current_agent)):
    return [
        {"event": "nueva_conversacion", "label": "Nueva conversación entrante", "email": True, "whatsapp": False, "browser": True},
        {"event": "conversacion_escalada", "label": "Conversación escalada", "email": True, "whatsapp": True, "browser": True},
        {"event": "sla_vencido", "label": "SLA vencido", "email": True, "whatsapp": True, "browser": True},
        {"event": "nueva_pqrs", "label": "Nueva PQRS", "email": True, "whatsapp": False, "browser": True},
        {"event": "campana_completada", "label": "Campaña completada", "email": True, "whatsapp": False, "browser": False},
        {"event": "error_integracion", "label": "Error de integración", "email": True, "whatsapp": True, "browser": True},
        {"event": "nuevo_agente", "label": "Nuevo agente creado", "email": False, "whatsapp": False, "browser": False},
        {"event": "informe_semanal", "label": "Informe semanal por email", "email": True, "whatsapp": False, "browser": False},
    ]


@router.put("/notifications")
def update_notification_settings(
    data: List[NotificationSettings],
    _admin: models.DBAgent = Depends(get_current_admin),
):
    return {"status": "updated", "count": len(data)}


@router.get("/ai")
def get_ai_settings(_agent: models.DBAgent = Depends(get_current_agent)):
    import os
    return {
        "provider": "openai",
        "model_copilot": "gpt-4o",
        "model_summary": "gpt-3.5-turbo",
        "temperature": 0.7,
        "max_tokens": 500,
        "confidence_threshold": 0.75,
        "copilot_suggestions": 3,
        "sentiment_analysis": True,
        "auto_summary": True,
        "qa_scoring": True,
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "anthropic_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
        "estimated_monthly_cost_usd": 47.50,
    }


@router.put("/ai")
def update_ai_settings(
    data: AISettings,
    _admin: models.DBAgent = Depends(get_current_admin),
):
    return {"status": "updated", **data.model_dump()}


@router.get("/appearance")
def get_appearance_settings(_agent: models.DBAgent = Depends(get_current_agent)):
    return {
        "widget_color": "#2563eb",
        "widget_position": "bottom-right",
        "widget_greeting": "¡Hola! 👋 Soy el asistente de COMFAGUAJIRA. ¿En qué puedo ayudarte?",
        "bot_name": "Asistente COMFAGUAJIRA",
        "avatar_style": "bot-1",
        "dark_mode": False,
    }


@router.put("/appearance")
def update_appearance_settings(
    data: Dict[str, Any],
    _admin: models.DBAgent = Depends(get_current_admin),
):
    return {"status": "updated", **data}
