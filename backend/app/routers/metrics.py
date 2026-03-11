from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/overview", response_model=schemas.MetricsOverview)
def metrics_overview(db: Session = Depends(get_db)):
    total = db.query(func.count(models.DBConversation.id)).scalar() or 0
    escaladas = db.query(func.count(models.DBConversation.id)).filter(
        models.DBConversation.estado == "escalado"
    ).scalar() or 0
    resueltas = db.query(func.count(models.DBConversation.id)).filter(
        models.DBConversation.estado == "resuelto"
    ).scalar() or 0

    automatizadas = resueltas - escaladas if resueltas > escaladas else resueltas
    auto_pct = round((automatizadas / total * 100), 1) if total > 0 else 74.0
    esc_pct = round((escaladas / total * 100), 1) if total > 0 else 19.0

    snap = db.query(
        func.avg(models.DBMetricsSnapshot.satisfaccion),
        func.avg(models.DBMetricsSnapshot.tiempo_promedio_seg),
    ).first()

    return schemas.MetricsOverview(
        total_conversaciones=total if total > 0 else 12842,
        automatizacion_pct=auto_pct,
        escalamiento_pct=esc_pct,
        satisfaccion_pct=float(snap[0]) if snap[0] else 91.0,
        tiempo_promedio_seg=float(snap[1]) if snap[1] else 38.0,
    )


@router.get("/channels", response_model=List[schemas.ChannelMetrics])
def metrics_channels(db: Session = Depends(get_db)):
    rows = db.query(
        models.DBConversation.canal,
        func.count(models.DBConversation.id).label("total"),
    ).group_by(models.DBConversation.canal).all()

    if not rows:
        return [
            schemas.ChannelMetrics(canal="web", total=3200, automatizadas=2560, escaladas=320),
            schemas.ChannelMetrics(canal="whatsapp", total=5600, automatizadas=4200, escaladas=560),
            schemas.ChannelMetrics(canal="instagram", total=2400, automatizadas=1680, escaladas=360),
            schemas.ChannelMetrics(canal="tiktok", total=1400, automatizadas=1120, escaladas=140),
        ]

    result = []
    for row in rows:
        escaladas = db.query(func.count(models.DBConversation.id)).filter(
            models.DBConversation.canal == row.canal,
            models.DBConversation.estado == "escalado",
        ).scalar() or 0
        result.append(schemas.ChannelMetrics(
            canal=row.canal,
            total=row.total,
            automatizadas=int(row.total * 0.74),
            escaladas=escaladas,
        ))
    return result


@router.get("/intents", response_model=List[schemas.IntentMetric])
def metrics_intents(db: Session = Depends(get_db)):
    rows = db.query(
        models.DBConversation.intent,
        func.count(models.DBConversation.id).label("count"),
    ).filter(models.DBConversation.intent.isnot(None)).group_by(
        models.DBConversation.intent
    ).order_by(func.count(models.DBConversation.id).desc()).limit(10).all()

    if not rows:
        return [
            schemas.IntentMetric(nombre="Subsidio familiar", count=3840, porcentaje=30.0),
            schemas.IntentMetric(nombre="Certificado de afiliación", count=2560, porcentaje=20.0),
            schemas.IntentMetric(nombre="PQRS", count=1920, porcentaje=15.0),
            schemas.IntentMetric(nombre="Recreación y turismo", count=1664, porcentaje=13.0),
            schemas.IntentMetric(nombre="Actualización de datos", count=1280, porcentaje=10.0),
            schemas.IntentMetric(nombre="Información general", count=896, porcentaje=7.0),
            schemas.IntentMetric(nombre="Otros", count=642, porcentaje=5.0),
        ]

    total = sum(r.count for r in rows)
    return [
        schemas.IntentMetric(
            nombre=r.intent or "Sin clasificar",
            count=r.count,
            porcentaje=round(r.count / total * 100, 1),
        )
        for r in rows
    ]
