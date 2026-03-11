from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from pydantic import BaseModel
from app.database import get_db
from app import models
from app.deps import get_current_agent, get_current_admin
import uuid
import httpx

router = APIRouter(prefix="/integrations", tags=["integrations"])


class IntegrationConfig(BaseModel):
    nombre: str
    tipo: str  # crm, erp, db, ai, communication, analytics
    api_key: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    endpoint_url: Optional[str] = None
    extra_config: Optional[dict] = None


class IntegrationOut(BaseModel):
    id: str
    nombre: str
    tipo: str
    estado: str  # conectado, desconectado, error
    last_sync: Optional[str] = None
    registros: int = 0
    config_keys: List[str] = []  # only key names, never values


class TestConnectionRequest(BaseModel):
    tipo: str
    api_key: Optional[str] = None
    endpoint_url: Optional[str] = None


@router.get("", response_model=List[IntegrationOut])
def list_integrations(
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    """List all configured integrations. Returns mock data + any DB-stored ones."""
    # In production these would come from a DBIntegration model
    # For PoC, return mock data
    return [
        IntegrationOut(
            id="int1",
            nombre="SISFAMILIAR BD Afiliados",
            tipo="db",
            estado="conectado",
            last_sync="2026-03-10T09:55:00Z",
            registros=52431,
            config_keys=["host", "port", "database", "username"],
        ),
        IntegrationOut(
            id="int2",
            nombre="Sistema de Certificados",
            tipo="db",
            estado="conectado",
            last_sync="2026-03-10T08:00:00Z",
            registros=8234,
            config_keys=["base_url", "api_key"],
        ),
    ]


@router.post("/test-connection")
async def test_connection(
    data: TestConnectionRequest,
    _agent: models.DBAgent = Depends(get_current_agent),
):
    """Test an integration connection. Returns simulated result for PoC."""
    import asyncio
    await asyncio.sleep(0.5)  # Simulate network call

    # For PoC: simulate successful connection
    mock_results = {
        "crm": {"success": True, "records": 12430, "message": "Conexión exitosa. 12.430 contactos encontrados."},
        "db": {"success": True, "records": 52431, "message": "Conexión exitosa. 52.431 registros encontrados."},
        "erp": {"success": True, "records": 1240, "message": "Conexión exitosa. 1.240 transacciones disponibles."},
        "ai": {"success": True, "records": 0, "message": "Clave API válida. Modelo disponible: gpt-4o."},
        "analytics": {"success": True, "records": 0, "message": "Cuenta conectada. 5 propiedades encontradas."},
    }
    result = mock_results.get(data.tipo, {"success": True, "records": 0, "message": "Conexión establecida correctamente."})
    return result


@router.post("")
def create_integration(
    data: IntegrationConfig,
    _admin: models.DBAgent = Depends(get_current_admin),
):
    """Register a new integration. Credentials stored encrypted (simplified for PoC)."""
    return {
        "id": str(uuid.uuid4()),
        "nombre": data.nombre,
        "tipo": data.tipo,
        "estado": "conectado",
        "message": f"Integración '{data.nombre}' configurada exitosamente.",
    }


@router.delete("/{integration_id}", status_code=status.HTTP_204_NO_CONTENT)
def disconnect_integration(
    integration_id: str,
    _admin: models.DBAgent = Depends(get_current_admin),
):
    pass  # In production: remove credentials from secure store


@router.get("/webhooks")
def list_webhooks(_agent: models.DBAgent = Depends(get_current_agent)):
    """List configured outbound webhooks."""
    return [
        {"id": "wh1", "event": "conversation.escalated", "url": "https://erp.comfaguajira.com/webhooks/chat", "activo": True, "last_triggered": "2026-03-10T09:00:00Z"},
        {"id": "wh2", "event": "campaign.completed", "url": "https://analytics.comfaguajira.com/events", "activo": True, "last_triggered": "2026-03-09T08:05:00Z"},
    ]


@router.get("/logs")
def integration_logs(_agent: models.DBAgent = Depends(get_current_agent)):
    """Get recent integration logs."""
    return [
        {"timestamp": "2026-03-10T09:55:00Z", "integracion": "SISFAMILIAR", "evento": "Sync afiliados", "estado": "exitoso", "detalles": "52.431 registros sincronizados"},
        {"timestamp": "2026-03-10T09:00:00Z", "integracion": "Sistema Certificados", "evento": "Generación PDF", "estado": "exitoso", "detalles": "Certificado #8234 generado"},
        {"timestamp": "2026-03-10T08:30:00Z", "integracion": "OpenAI", "evento": "Copilot request", "estado": "exitoso", "detalles": "3 sugerencias generadas, 847 tokens"},
        {"timestamp": "2026-03-10T07:00:00Z", "integracion": "SISFAMILIAR", "evento": "Sync afiliados", "estado": "exitoso", "detalles": "52.428 registros sincronizados"},
        {"timestamp": "2026-03-09T18:00:00Z", "integracion": "WhatsApp API", "evento": "Campaña enviada", "estado": "exitoso", "detalles": "4.820 mensajes enviados"},
    ]
