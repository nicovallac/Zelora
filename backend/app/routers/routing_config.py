from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from typing import Optional, List
from app import models
from app.deps import get_current_agent, get_current_admin

router = APIRouter(prefix="/routing", tags=["routing"])


class RoutingStrategy(BaseModel):
    strategy: str  # round_robin, by_load, by_specialization, ai_mixed


class RoutingRule(BaseModel):
    condicion_campo: str  # canal, intent, sentimiento, hora
    condicion_operador: str  # =, !=, >, <
    condicion_valor: str
    accion: str
    prioridad: int = 10
    activo: bool = True


class QueueConfig(BaseModel):
    max_queue_minutes: int = 10
    queue_message: str
    max_parallel_per_agent: int = 5
    auto_assign: bool = True


@router.get("/strategy")
def get_strategy(_agent: models.DBAgent = Depends(get_current_agent)):
    return {"strategy": "by_load", "description": "Asigna al asesor con menos conversaciones activas"}


@router.put("/strategy")
def update_strategy(
    data: RoutingStrategy,
    _admin: models.DBAgent = Depends(get_current_admin),
):
    return {"status": "ok", "strategy": data.strategy}


@router.get("/rules")
def list_rules(_agent: models.DBAgent = Depends(get_current_agent)):
    return [
        {"id": "rr1", "prioridad": 1, "condicion": "Canal = Instagram", "accion": "Asignar a Diana Suárez", "activo": True},
        {"id": "rr2", "prioridad": 2, "condicion": "Intención = PQRS", "accion": "Asignar a equipo PQRS", "activo": True},
        {"id": "rr3", "prioridad": 3, "condicion": "Sentimiento = negativo", "accion": "Escalar a supervisor", "activo": True},
        {"id": "rr4", "prioridad": 4, "condicion": "Hora > 18:00 o < 8:00", "accion": "Respuesta automática fuera de horario", "activo": True},
        {"id": "rr5", "prioridad": 5, "condicion": "Sin asesor disponible > 5 min", "accion": "Notificar al supervisor", "activo": True},
    ]


@router.post("/rules", status_code=status.HTTP_201_CREATED)
def create_rule(
    data: RoutingRule,
    _admin: models.DBAgent = Depends(get_current_admin),
):
    import uuid
    return {
        "id": str(uuid.uuid4()),
        "condicion": f"{data.condicion_campo} {data.condicion_operador} {data.condicion_valor}",
        "accion": data.accion,
        "prioridad": data.prioridad,
        "activo": data.activo,
    }


@router.put("/rules/{rule_id}")
def update_rule(
    rule_id: str,
    data: RoutingRule,
    _admin: models.DBAgent = Depends(get_current_admin),
):
    return {"id": rule_id, "status": "updated"}


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rule(rule_id: str, _admin: models.DBAgent = Depends(get_current_admin)):
    pass


@router.get("/queue-config")
def get_queue_config(_agent: models.DBAgent = Depends(get_current_agent)):
    return {
        "max_queue_minutes": 10,
        "queue_message": "Estamos atendiendo tu solicitud, un asesor estará contigo en breve...",
        "max_parallel_per_agent": 5,
        "auto_assign": True,
    }


@router.put("/queue-config")
def update_queue_config(
    data: QueueConfig,
    _admin: models.DBAgent = Depends(get_current_admin),
):
    return {"status": "ok", **data.model_dump()}


@router.get("/stats")
def get_routing_stats(_agent: models.DBAgent = Depends(get_current_agent)):
    return {
        "auto_assignment_pct": 91,
        "avg_wait_time_min": 1.8,
        "reassignment_pct": 3,
        "sla_compliance_pct": 94,
        "agent_load": [
            {"nombre": "Carlos Pérez", "activas": 3, "en_cola": 1, "capacidad": 5, "disponible": True},
            {"nombre": "Laura Gutiérrez", "activas": 5, "en_cola": 0, "capacidad": 5, "disponible": False},
            {"nombre": "Andrés Morales", "activas": 2, "en_cola": 0, "capacidad": 5, "disponible": True},
            {"nombre": "Diana Suárez", "activas": 4, "en_cola": 2, "capacidad": 5, "disponible": False},
        ],
    }
