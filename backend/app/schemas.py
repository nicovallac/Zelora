from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    agent_id: str
    agent_nombre: str
    agent_rol: str = "asesor"


class LoginRequest(BaseModel):
    email: str
    password: str


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True


class TimelineEventOut(BaseModel):
    id: str
    tipo: str
    descripcion: str
    timestamp: datetime

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    id: str
    cedula: str
    nombre: str
    apellido: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    tipo_afiliado: str

    class Config:
        from_attributes = True


class ConversationListItem(BaseModel):
    id: str
    canal: str
    estado: str
    intent: Optional[str] = None
    sentimiento: str
    last_message_at: datetime
    created_at: datetime
    user: Optional[UserOut] = None
    agent_nombre: Optional[str] = None

    class Config:
        from_attributes = True


class ConversationDetail(ConversationListItem):
    messages: List[MessageOut] = []
    timeline: List[TimelineEventOut] = []


class SendMessageRequest(BaseModel):
    content: str
    role: str = "agent"


class MetricsOverview(BaseModel):
    total_conversaciones: int
    automatizacion_pct: float
    escalamiento_pct: float
    satisfaccion_pct: float
    tiempo_promedio_seg: float


class ChannelMetrics(BaseModel):
    canal: str
    total: int
    automatizadas: int
    escaladas: int


class IntentMetric(BaseModel):
    nombre: str
    count: int
    porcentaje: float


class PricingItem(BaseModel):
    id: str
    tipo: str
    nombre: str
    precio: Optional[float]
    moneda: str
    descripcion: Optional[str]
    metadata_: Optional[Any] = None

    class Config:
        from_attributes = True


# Agent management
class AgentOut(BaseModel):
    id: str
    nombre: str
    email: str
    rol: str
    activo: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AgentCreate(BaseModel):
    nombre: str
    email: str
    password: str
    rol: str = "asesor"


class AgentUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    rol: Optional[str] = None
    activo: Optional[bool] = None


# User (afiliado) management
class UserCreate(BaseModel):
    nombre: str
    apellido: str
    cedula: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    tipo_afiliado: str = "trabajador"


class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    cedula: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    tipo_afiliado: Optional[str] = None
    activo: Optional[bool] = None


class UserListItem(BaseModel):
    id: str
    cedula: str
    nombre: str
    apellido: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    tipo_afiliado: str
    activo: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Notifications
class NotificationOut(BaseModel):
    id: str
    tipo: str
    titulo: str
    mensaje: Optional[str] = None
    leida: bool
    created_at: datetime

    class Config:
        from_attributes = True


# WhatsApp
class WhatsAppSendRequest(BaseModel):
    to: str  # phone number with country code e.g. 573001234567
    message: str
    message_type: str = "text"  # text, template


class WhatsAppSendResponse(BaseModel):
    success: bool
    message_id: Optional[str] = None
    error: Optional[str] = None


# Organization
class OrganizationOut(BaseModel):
    id: str
    nombre: str
    nit: Optional[str] = None
    plan: str
    activo: bool
    configuracion: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OrganizationUpdate(BaseModel):
    nombre: Optional[str] = None
    plan: Optional[str] = None
    configuracion: Optional[dict] = None
    activo: Optional[bool] = None


# Knowledge Base
class KBArticleOut(BaseModel):
    id: str
    titulo: str
    categoria: str
    contenido: str
    tags: List[str] = []
    activo: bool
    visitas: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class KBArticleCreate(BaseModel):
    titulo: str
    categoria: str
    contenido: str
    tags: List[str] = []
    activo: bool = True


class KBArticleUpdate(BaseModel):
    titulo: Optional[str] = None
    categoria: Optional[str] = None
    contenido: Optional[str] = None
    tags: Optional[List[str]] = None
    activo: Optional[bool] = None


class KBSearchResult(BaseModel):
    id: str
    titulo: str
    categoria: str
    snippet: str  # first 200 chars of content
    score: float  # relevance score 0-1


# Templates
class TemplateOut(BaseModel):
    id: str
    nombre: str
    categoria: str
    idioma: str
    contenido: str
    variables: List[str] = []
    estado: str
    created_at: datetime

    class Config:
        from_attributes = True


class TemplateCreate(BaseModel):
    nombre: str
    categoria: str
    idioma: str = "es"
    contenido: str
    variables: List[str] = []


# Campaigns
class CampaignOut(BaseModel):
    id: str
    nombre: str
    tipo: str
    template_id: Optional[str] = None
    audiencia: dict = {}
    estado: str
    total: int
    enviados: int
    leidos: int
    respondidos: int
    scheduled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CampaignCreate(BaseModel):
    nombre: str
    tipo: str
    template_id: Optional[str] = None
    audiencia: dict = {}
    scheduled_at: Optional[datetime] = None


# QA Score
class QAScoreOut(BaseModel):
    id: str
    conversation_id: str
    score_total: int
    intent_resolved: int
    time_score: int
    sentiment_score: int
    no_escalation_score: int
    protocol_score: int
    generated_at: datetime

    class Config:
        from_attributes = True


# Flow Builder
class FlowConfigOut(BaseModel):
    id: str
    nombre: str
    descripcion: Optional[str] = None
    canal: str
    activo: bool
    nodes: List[dict] = []
    edges: List[dict] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FlowConfigCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    canal: str = "whatsapp"
    nodes: List[dict] = []
    edges: List[dict] = []


# AI Services
class CopilotRequest(BaseModel):
    conversation_id: str
    intent: Optional[str] = None
    last_messages: List[str] = []


class CopilotResponse(BaseModel):
    suggestions: List[str]
    intent_detected: Optional[str] = None
    confidence: float = 0.0


class SummarizeRequest(BaseModel):
    conversation_id: str
    messages: List[dict]  # list of {role, content}


class SummarizeResponse(BaseModel):
    resumen: str
    intent_principal: str
    resolucion: str  # resuelto/escalado/pendiente
    entidades: dict  # cedula, tramite, etc.


class SearchKBRequest(BaseModel):
    query: str
    top_k: int = 3


# Smart Routing
class RoutingDecision(BaseModel):
    agent_id: Optional[str] = None
    agent_nombre: Optional[str] = None
    reason: str
    score: float
