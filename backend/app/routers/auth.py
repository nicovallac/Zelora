from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=schemas.Token)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    agent = db.query(models.DBAgent).filter(models.DBAgent.email == request.email).first()
    if not agent or not verify_password(request.password, agent.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")
    if not agent.activo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta desactivada")
    token = create_access_token({"sub": agent.id, "email": agent.email, "rol": agent.rol})
    return schemas.Token(
        access_token=token,
        agent_id=agent.id,
        agent_nombre=agent.nombre,
        agent_rol=agent.rol,
    )
