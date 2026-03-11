from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.deps import get_current_agent
from datetime import datetime, timezone
import uuid

router = APIRouter(tags=["campaigns"])


def gen_id():
    return str(uuid.uuid4())


# ── Templates ────────────────────────────────────────────────────────────────

@router.get("/templates", response_model=List[schemas.TemplateOut])
def list_templates(
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    return db.query(models.DBTemplate).order_by(models.DBTemplate.created_at.desc()).all()


@router.post("/templates", response_model=schemas.TemplateOut, status_code=status.HTTP_201_CREATED)
def create_template(
    data: schemas.TemplateCreate,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    tmpl = models.DBTemplate(
        id=gen_id(),
        nombre=data.nombre,
        categoria=data.categoria,
        idioma=data.idioma,
        contenido=data.contenido,
        variables=data.variables,
        estado="pending",
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)
    return tmpl


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    tmpl = db.query(models.DBTemplate).filter(models.DBTemplate.id == template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    db.delete(tmpl)
    db.commit()


# ── Campaigns ─────────────────────────────────────────────────────────────────

@router.get("/campaigns", response_model=List[schemas.CampaignOut])
def list_campaigns(
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    return db.query(models.DBCampaign).order_by(models.DBCampaign.created_at.desc()).all()


@router.post("/campaigns", response_model=schemas.CampaignOut, status_code=status.HTTP_201_CREATED)
def create_campaign(
    data: schemas.CampaignCreate,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    # Estimate audience size
    total = db.query(models.DBUser).filter(models.DBUser.activo == True).count()
    if data.audiencia.get("tipo_afiliado"):
        total = db.query(models.DBUser).filter(
            models.DBUser.activo == True,
            models.DBUser.tipo_afiliado == data.audiencia["tipo_afiliado"],
        ).count()

    campaign = models.DBCampaign(
        id=gen_id(),
        nombre=data.nombre,
        tipo=data.tipo,
        template_id=data.template_id,
        audiencia=data.audiencia,
        estado="programada" if data.scheduled_at else "borrador",
        total=total,
        scheduled_at=data.scheduled_at,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.post("/campaigns/{campaign_id}/send")
def send_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    campaign = db.query(models.DBCampaign).filter(models.DBCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    if campaign.estado == "completada":
        raise HTTPException(status_code=400, detail="La campaña ya fue enviada")
    # In production: enqueue to Celery for batch sending
    # For PoC: simulate sending
    campaign.estado = "completada"
    campaign.enviados = campaign.total
    campaign.leidos = int(campaign.total * 0.89)  # 89% read rate simulation
    campaign.respondidos = int(campaign.total * 0.23)  # 23% response rate
    campaign.completed_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "enviada", "enviados": campaign.enviados, "message": "Campaña enviada exitosamente"}


@router.delete("/campaigns/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    campaign = db.query(models.DBCampaign).filter(models.DBCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    db.delete(campaign)
    db.commit()
