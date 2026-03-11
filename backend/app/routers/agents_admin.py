from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.auth import hash_password
from app.deps import get_current_admin
import uuid

router = APIRouter(prefix="/admin/agents", tags=["admin"])


def gen_id():
    return str(uuid.uuid4())


@router.get("", response_model=List[schemas.AgentOut])
def list_agents(
    db: Session = Depends(get_db),
    _admin: models.DBAgent = Depends(get_current_admin),
):
    return db.query(models.DBAgent).order_by(models.DBAgent.created_at.desc()).all()


@router.post("", response_model=schemas.AgentOut, status_code=status.HTTP_201_CREATED)
def create_agent(
    data: schemas.AgentCreate,
    db: Session = Depends(get_db),
    _admin: models.DBAgent = Depends(get_current_admin),
):
    existing = db.query(models.DBAgent).filter(models.DBAgent.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un asesor con ese email")
    agent = models.DBAgent(
        id=gen_id(),
        nombre=data.nombre,
        email=data.email,
        hashed_password=hash_password(data.password),
        rol=data.rol,
        activo=True,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.put("/{agent_id}", response_model=schemas.AgentOut)
def update_agent(
    agent_id: str,
    data: schemas.AgentUpdate,
    db: Session = Depends(get_db),
    _admin: models.DBAgent = Depends(get_current_admin),
):
    agent = db.query(models.DBAgent).filter(models.DBAgent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Asesor no encontrado")
    if data.nombre is not None:
        agent.nombre = data.nombre
    if data.email is not None:
        # Check uniqueness
        dup = db.query(models.DBAgent).filter(models.DBAgent.email == data.email, models.DBAgent.id != agent_id).first()
        if dup:
            raise HTTPException(status_code=400, detail="Email ya está en uso")
        agent.email = data.email
    if data.password is not None:
        agent.hashed_password = hash_password(data.password)
    if data.rol is not None:
        agent.rol = data.rol
    if data.activo is not None:
        agent.activo = data.activo
    db.commit()
    db.refresh(agent)
    return agent


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    admin: models.DBAgent = Depends(get_current_admin),
):
    if agent_id == admin.id:
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propio usuario")
    agent = db.query(models.DBAgent).filter(models.DBAgent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Asesor no encontrado")
    agent.activo = False
    db.commit()
