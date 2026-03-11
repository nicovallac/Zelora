from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.deps import get_current_agent
import uuid

router = APIRouter(prefix="/admin/users", tags=["admin"])


def gen_id():
    return str(uuid.uuid4())


@router.get("", response_model=List[schemas.UserListItem])
def list_users(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    q = db.query(models.DBUser)
    if search:
        term = f"%{search}%"
        q = q.filter(
            or_(
                models.DBUser.nombre.ilike(term),
                models.DBUser.apellido.ilike(term),
                models.DBUser.cedula.ilike(term),
                models.DBUser.telefono.ilike(term),
                models.DBUser.email.ilike(term),
            )
        )
    return q.order_by(models.DBUser.created_at.desc()).limit(100).all()


@router.post("", response_model=schemas.UserListItem, status_code=status.HTTP_201_CREATED)
def create_user(
    data: schemas.UserCreate,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    existing = db.query(models.DBUser).filter(models.DBUser.cedula == data.cedula).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un afiliado con esa cédula")
    user = models.DBUser(
        id=gen_id(),
        nombre=data.nombre,
        apellido=data.apellido,
        cedula=data.cedula,
        telefono=data.telefono,
        email=data.email,
        tipo_afiliado=data.tipo_afiliado,
        activo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=schemas.UserListItem)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    user = db.query(models.DBUser).filter(models.DBUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Afiliado no encontrado")
    return user


@router.put("/{user_id}", response_model=schemas.UserListItem)
def update_user(
    user_id: str,
    data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    user = db.query(models.DBUser).filter(models.DBUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Afiliado no encontrado")
    for field in ['nombre', 'apellido', 'cedula', 'telefono', 'email', 'tipo_afiliado', 'activo']:
        val = getattr(data, field, None)
        if val is not None:
            setattr(user, field, val)
    db.commit()
    db.refresh(user)
    return user
