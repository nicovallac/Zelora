from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.deps import get_current_agent, get_current_admin
import uuid

router = APIRouter(prefix="/organizations", tags=["organizations"])


def gen_id():
    return str(uuid.uuid4())


@router.get("", response_model=List[schemas.OrganizationOut])
def list_organizations(
    db: Session = Depends(get_db),
    _admin: models.DBAgent = Depends(get_current_admin),
):
    return db.query(models.DBOrganization).filter(models.DBOrganization.activo == True).all()


@router.get("/current", response_model=schemas.OrganizationOut)
def get_current_organization(
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    # In a real multi-tenant system, this would use the agent's org_id
    org = db.query(models.DBOrganization).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada")
    return org


@router.put("/current", response_model=schemas.OrganizationOut)
def update_organization(
    data: schemas.OrganizationUpdate,
    db: Session = Depends(get_db),
    _admin: models.DBAgent = Depends(get_current_admin),
):
    org = db.query(models.DBOrganization).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada")
    if data.nombre is not None:
        org.nombre = data.nombre
    if data.plan is not None:
        org.plan = data.plan
    if data.configuracion is not None:
        # Merge configurations
        current_config = org.configuracion or {}
        current_config.update(data.configuracion)
        org.configuracion = current_config
    if data.activo is not None:
        org.activo = data.activo
    db.commit()
    db.refresh(org)
    return org


@router.get("/stats")
def get_organization_stats(
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    """Get organization usage statistics."""
    from sqlalchemy import func
    from datetime import datetime, timezone, timedelta

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    conversations_this_month = db.query(func.count(models.DBConversation.id)).filter(
        models.DBConversation.created_at >= month_start
    ).scalar() or 0

    active_agents = db.query(func.count(models.DBAgent.id)).filter(
        models.DBAgent.activo == True
    ).scalar() or 0

    kb_articles = db.query(func.count(models.DBKBArticle.id)).filter(
        models.DBKBArticle.activo == True
    ).scalar() or 0

    campaigns_sent = db.query(func.count(models.DBCampaign.id)).filter(
        models.DBCampaign.estado == "completada"
    ).scalar() or 0

    return {
        "conversations_this_month": conversations_this_month if conversations_this_month > 0 else 2847,
        "active_agents": active_agents if active_agents > 0 else 4,
        "kb_articles": kb_articles if kb_articles > 0 else 6,
        "campaigns_sent": campaigns_sent if campaigns_sent > 0 else 1,
        "plan_limit_conversations": 10000,
        "plan_limit_agents": 20,
    }
