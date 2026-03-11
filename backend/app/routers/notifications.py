from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.deps import get_current_agent
import uuid
from datetime import datetime

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=List[schemas.NotificationOut])
def list_notifications(
    db: Session = Depends(get_db),
    agent: models.DBAgent = Depends(get_current_agent),
):
    return db.query(models.DBNotification).filter(
        (models.DBNotification.agent_id == agent.id) | (models.DBNotification.agent_id == None)
    ).order_by(models.DBNotification.created_at.desc()).limit(50).all()


@router.post("/{notif_id}/read")
def mark_read(
    notif_id: str,
    db: Session = Depends(get_db),
    agent: models.DBAgent = Depends(get_current_agent),
):
    n = db.query(models.DBNotification).filter(models.DBNotification.id == notif_id).first()
    if n:
        n.leida = True
        db.commit()
    return {"status": "ok"}


@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    agent: models.DBAgent = Depends(get_current_agent),
):
    db.query(models.DBNotification).filter(
        (models.DBNotification.agent_id == agent.id) | (models.DBNotification.agent_id == None)
    ).update({"leida": True})
    db.commit()
    return {"status": "ok"}
