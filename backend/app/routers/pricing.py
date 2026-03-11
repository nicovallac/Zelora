from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/pricing", tags=["pricing"])


@router.get("", response_model=List[schemas.PricingItem])
def get_pricing(db: Session = Depends(get_db)):
    items = db.query(models.DBPricingCatalog).filter(models.DBPricingCatalog.activo == True).all()
    if not items:
        return [
            schemas.PricingItem(id="p1", tipo="pilot", nombre="Escenario Piloto", precio=6500000, moneda="COP", descripcion="1 mes, WhatsApp + Web, hasta 3.000 conversaciones"),
            schemas.PricingItem(id="p2", tipo="plan", nombre="Plan Base", precio=1799000, moneda="COP", descripcion="Hasta 5.000 conversaciones/mes"),
            schemas.PricingItem(id="p3", tipo="plan", nombre="Plan Profesional", precio=3299000, moneda="COP", descripcion="Hasta 10.000 conversaciones/mes"),
            schemas.PricingItem(id="p4", tipo="plan", nombre="Plan Enterprise", precio=None, moneda="COP", descripcion="Más de 10.000 conversaciones"),
            schemas.PricingItem(id="p5", tipo="addon", nombre="Canal adicional", precio=450000, moneda="COP", descripcion="Instagram DM, TikTok, Telegram"),
            schemas.PricingItem(id="p6", tipo="addon", nombre="Integración CRM", precio=900000, moneda="COP", descripcion="Salesforce, HubSpot, Zoho"),
            schemas.PricingItem(id="p7", tipo="addon", nombre="Integración ERP/Sistema interno", precio=1200000, moneda="COP", descripcion="SISFAMILIAR u otro sistema"),
            schemas.PricingItem(id="p8", tipo="addon", nombre="IA avanzada", precio=900000, moneda="COP", descripcion="Modelos custom, embeddings, RAG"),
        ]
    return [schemas.PricingItem(
        id=i.id, tipo=i.tipo, nombre=i.nombre, precio=i.precio,
        moneda=i.moneda, descripcion=i.descripcion, metadata_=i.metadata_,
    ) for i in items]
