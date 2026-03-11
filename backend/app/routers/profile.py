from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app import models, schemas
from app.deps import get_current_agent
from app.auth import hash_password, verify_password

router = APIRouter(prefix="/profile", tags=["profile"])


class ProfileUpdate(BaseModel):
    nombre: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


class MFASetup(BaseModel):
    code: str  # 6-digit verification code


@router.get("", response_model=schemas.AgentOut)
def get_profile(agent: models.DBAgent = Depends(get_current_agent)):
    return agent


@router.put("", response_model=schemas.AgentOut)
def update_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    agent: models.DBAgent = Depends(get_current_agent),
):
    if data.nombre:
        agent.nombre = data.nombre
    db.commit()
    db.refresh(agent)
    return agent


@router.post("/change-password")
def change_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    agent: models.DBAgent = Depends(get_current_agent),
):
    if not verify_password(data.current_password, agent.hashed_password):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Las contraseñas no coinciden")
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")
    agent.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"status": "ok", "message": "Contraseña actualizada correctamente"}


@router.post("/mfa/setup")
def setup_mfa(
    data: MFASetup,
    agent: models.DBAgent = Depends(get_current_agent),
):
    """Verify MFA code and activate. For PoC: accept any 6-digit code."""
    if len(data.code) != 6 or not data.code.isdigit():
        raise HTTPException(status_code=400, detail="Código inválido. Debe ser 6 dígitos.")
    # In production: verify TOTP code against stored secret
    return {"status": "ok", "mfa_enabled": True, "message": "MFA activado correctamente"}


@router.get("/sessions")
def get_sessions(agent: models.DBAgent = Depends(get_current_agent)):
    """Return mock active sessions."""
    return [
        {"id": "s1", "device": "Chrome en Windows", "ip": "186.29.45.12", "location": "Riohacha, Colombia", "started": "2026-03-10T07:30:00Z", "last_active": "hace 2 min", "current": True},
        {"id": "s2", "device": "Firefox en MacOS", "ip": "190.24.12.88", "location": "Barranquilla, Colombia", "started": "2026-03-07T14:00:00Z", "last_active": "hace 3 días", "current": False},
    ]


@router.delete("/sessions/{session_id}")
def revoke_session(
    session_id: str,
    agent: models.DBAgent = Depends(get_current_agent),
):
    return {"status": "ok", "message": f"Sesión {session_id} cerrada"}


@router.delete("/sessions")
def revoke_all_sessions(agent: models.DBAgent = Depends(get_current_agent)):
    return {"status": "ok", "message": "Todas las otras sesiones han sido cerradas"}
