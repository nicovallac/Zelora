from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class DBUser(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_uuid)
    cedula = Column(String, unique=True, index=True, nullable=False)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    telefono = Column(String)
    email = Column(String)
    tipo_afiliado = Column(String, default="trabajador")  # trabajador, pensionado, independiente
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    conversations = relationship("DBConversation", back_populates="user")


class DBAgent(Base):
    __tablename__ = "agents"
    id = Column(String, primary_key=True, default=gen_uuid)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    activo = Column(Boolean, default=True)
    rol = Column(String, default="asesor")  # asesor, admin
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    conversations = relationship("DBConversation", back_populates="agent")


class DBConversation(Base):
    __tablename__ = "conversations"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=True)
    canal = Column(String, nullable=False)  # web, whatsapp, instagram, tiktok
    estado = Column(String, default="nuevo")  # nuevo, en_proceso, escalado, resuelto
    intent = Column(String)
    sentimiento = Column(String, default="neutro")  # positivo, neutro, negativo
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_message_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    user = relationship("DBUser", back_populates="conversations")
    agent = relationship("DBAgent", back_populates="conversations")
    messages = relationship("DBMessage", back_populates="conversation", order_by="DBMessage.timestamp")
    timeline = relationship("DBTimelineEvent", back_populates="conversation", order_by="DBTimelineEvent.timestamp")
    tickets = relationship("DBTicket", back_populates="conversation")


class DBMessage(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True, default=gen_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    role = Column(String, nullable=False)  # user, bot, agent
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    conversation = relationship("DBConversation", back_populates="messages")


class DBIntent(Base):
    __tablename__ = "intents"
    id = Column(String, primary_key=True, default=gen_uuid)
    nombre = Column(String, unique=True, nullable=False)
    descripcion = Column(Text)
    ejemplos = Column(JSON)  # list of example phrases


class DBTicket(Base):
    __tablename__ = "tickets"
    id = Column(String, primary_key=True, default=gen_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"))
    tipo = Column(String)  # PQRS, solicitud, queja, reclamo
    descripcion = Column(Text)
    estado = Column(String, default="abierto")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    conversation = relationship("DBConversation", back_populates="tickets")


class DBTimelineEvent(Base):
    __tablename__ = "events_timeline"
    id = Column(String, primary_key=True, default=gen_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    tipo = Column(String)  # bot_start, intent_detected, escalated, agent_reply, resolved, note
    descripcion = Column(Text)
    metadata_ = Column("metadata", JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    conversation = relationship("DBConversation", back_populates="timeline")


class DBMetricsSnapshot(Base):
    __tablename__ = "metrics_snapshots"
    id = Column(String, primary_key=True, default=gen_uuid)
    fecha = Column(DateTime(timezone=True), nullable=False)
    canal = Column(String, nullable=False)
    conversaciones = Column(Integer, default=0)
    automatizadas = Column(Integer, default=0)
    escaladas = Column(Integer, default=0)
    resueltas = Column(Integer, default=0)
    satisfaccion = Column(Float, default=0.0)
    tiempo_promedio_seg = Column(Float, default=0.0)


class DBPricingCatalog(Base):
    __tablename__ = "pricing_catalog"
    id = Column(String, primary_key=True, default=gen_uuid)
    tipo = Column(String)  # pilot, plan, addon
    nombre = Column(String, nullable=False)
    precio = Column(Float, nullable=True)
    moneda = Column(String, default="COP")
    descripcion = Column(Text)
    metadata_ = Column("metadata", JSON, nullable=True)
    activo = Column(Boolean, default=True)


class DBNotification(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True, default=gen_uuid)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=True)  # None = broadcast
    tipo = Column(String)  # info, success, warning, error
    titulo = Column(String, nullable=False)
    mensaje = Column(Text)
    leida = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DBOrganization(Base):
    __tablename__ = "organizations"
    id = Column(String, primary_key=True, default=gen_uuid)
    nombre = Column(String, nullable=False)
    nit = Column(String, unique=True)
    plan = Column(String, default="base")  # base, profesional, enterprise
    activo = Column(Boolean, default=True)
    configuracion = Column(JSON, default={})  # slaMinutos, autoEscalarMinutos, horario, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DBKBArticle(Base):
    __tablename__ = "kb_articles"
    id = Column(String, primary_key=True, default=gen_uuid)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    titulo = Column(String, nullable=False)
    categoria = Column(String, nullable=False)  # Subsidios, Certificados, PQRS, etc.
    contenido = Column(Text, nullable=False)
    tags = Column(JSON, default=[])  # list of strings
    activo = Column(Boolean, default=True)
    visitas = Column(Integer, default=0)
    # embedding would go here for pgvector in production
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class DBTemplate(Base):
    __tablename__ = "templates"
    id = Column(String, primary_key=True, default=gen_uuid)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    nombre = Column(String, nullable=False)  # snake_case, WhatsApp template name
    categoria = Column(String, nullable=False)  # marketing, utilidad, autenticacion
    idioma = Column(String, default="es")
    contenido = Column(Text, nullable=False)  # with {{1}}, {{2}} placeholders
    variables = Column(JSON, default=[])  # list of variable names
    estado = Column(String, default="pending")  # pending, approved, rejected
    wa_template_id = Column(String, nullable=True)  # Meta's template ID after approval
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DBCampaign(Base):
    __tablename__ = "campaigns"
    id = Column(String, primary_key=True, default=gen_uuid)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    nombre = Column(String, nullable=False)
    tipo = Column(String, nullable=False)  # marketing, utilidad, autenticacion
    template_id = Column(String, ForeignKey("templates.id"), nullable=True)
    audiencia = Column(JSON, default={})  # filter config: tipo_afiliado, region, etc.
    estado = Column(String, default="borrador")  # borrador, programada, enviando, completada, cancelada
    total = Column(Integer, default=0)
    enviados = Column(Integer, default=0)
    leidos = Column(Integer, default=0)
    respondidos = Column(Integer, default=0)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    template = relationship("DBTemplate", foreign_keys=[template_id])


class DBQAScore(Base):
    __tablename__ = "qa_scores"
    id = Column(String, primary_key=True, default=gen_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), unique=True)
    score_total = Column(Integer, default=0)  # 0-100
    intent_resolved = Column(Integer, default=0)  # 0-30
    time_score = Column(Integer, default=0)  # 0-20
    sentiment_score = Column(Integer, default=0)  # 0-20
    no_escalation_score = Column(Integer, default=0)  # 0-15
    protocol_score = Column(Integer, default=0)  # 0-15
    generated_at = Column(DateTime(timezone=True), server_default=func.now())


class DBFlowConfig(Base):
    __tablename__ = "flow_configs"
    id = Column(String, primary_key=True, default=gen_uuid)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    nombre = Column(String, nullable=False)
    descripcion = Column(Text, nullable=True)
    canal = Column(String, default="whatsapp")
    activo = Column(Boolean, default=True)
    nodes = Column(JSON, default=[])  # list of node configs
    edges = Column(JSON, default=[])  # list of edge configs
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
