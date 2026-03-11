from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.deps import get_current_agent
import uuid

router = APIRouter(prefix="/flows", tags=["flow-builder"])


def gen_id():
    return str(uuid.uuid4())


@router.get("", response_model=List[schemas.FlowConfigOut])
def list_flows(
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    return db.query(models.DBFlowConfig).order_by(models.DBFlowConfig.created_at.desc()).all()


@router.post("", response_model=schemas.FlowConfigOut, status_code=status.HTTP_201_CREATED)
def create_flow(
    data: schemas.FlowConfigCreate,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    flow = models.DBFlowConfig(
        id=gen_id(),
        nombre=data.nombre,
        descripcion=data.descripcion,
        canal=data.canal,
        nodes=data.nodes,
        edges=data.edges,
        activo=True,
    )
    db.add(flow)
    db.commit()
    db.refresh(flow)
    return flow


@router.get("/{flow_id}", response_model=schemas.FlowConfigOut)
def get_flow(
    flow_id: str,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    flow = db.query(models.DBFlowConfig).filter(models.DBFlowConfig.id == flow_id).first()
    if not flow:
        raise HTTPException(status_code=404, detail="Flujo no encontrado")
    return flow


@router.put("/{flow_id}", response_model=schemas.FlowConfigOut)
def update_flow(
    flow_id: str,
    data: schemas.FlowConfigCreate,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    flow = db.query(models.DBFlowConfig).filter(models.DBFlowConfig.id == flow_id).first()
    if not flow:
        raise HTTPException(status_code=404, detail="Flujo no encontrado")
    flow.nombre = data.nombre
    flow.descripcion = data.descripcion
    flow.canal = data.canal
    flow.nodes = data.nodes
    flow.edges = data.edges
    db.commit()
    db.refresh(flow)
    return flow


@router.delete("/{flow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_flow(
    flow_id: str,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    flow = db.query(models.DBFlowConfig).filter(models.DBFlowConfig.id == flow_id).first()
    if not flow:
        raise HTTPException(status_code=404, detail="Flujo no encontrado")
    db.delete(flow)
    db.commit()
