from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.deps import get_current_agent
from app.ai_service import search_kb_mock
import uuid

router = APIRouter(prefix="/knowledge-base", tags=["knowledge-base"])


def gen_id():
    return str(uuid.uuid4())


@router.get("", response_model=List[schemas.KBArticleOut])
def list_articles(
    categoria: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    q = db.query(models.DBKBArticle)
    if categoria:
        q = q.filter(models.DBKBArticle.categoria == categoria)
    if activo is not None:
        q = q.filter(models.DBKBArticle.activo == activo)
    if search:
        term = f"%{search}%"
        q = q.filter(or_(
            models.DBKBArticle.titulo.ilike(term),
            models.DBKBArticle.contenido.ilike(term),
        ))
    return q.order_by(models.DBKBArticle.updated_at.desc()).all()


@router.post("", response_model=schemas.KBArticleOut, status_code=status.HTTP_201_CREATED)
def create_article(
    data: schemas.KBArticleCreate,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    article = models.DBKBArticle(
        id=gen_id(),
        titulo=data.titulo,
        categoria=data.categoria,
        contenido=data.contenido,
        tags=data.tags,
        activo=data.activo,
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


@router.get("/search", response_model=List[schemas.KBSearchResult])
def search_articles(
    q: str = Query(..., min_length=2),
    top_k: int = Query(3, le=10),
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    articles = db.query(models.DBKBArticle).filter(models.DBKBArticle.activo == True).all()
    results = search_kb_mock(q, articles, top_k)
    return [schemas.KBSearchResult(**r) for r in results]


@router.get("/{article_id}", response_model=schemas.KBArticleOut)
def get_article(
    article_id: str,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    art = db.query(models.DBKBArticle).filter(models.DBKBArticle.id == article_id).first()
    if not art:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    # Increment visit count
    art.visitas += 1
    db.commit()
    return art


@router.put("/{article_id}", response_model=schemas.KBArticleOut)
def update_article(
    article_id: str,
    data: schemas.KBArticleUpdate,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    art = db.query(models.DBKBArticle).filter(models.DBKBArticle.id == article_id).first()
    if not art:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    for field in ['titulo', 'categoria', 'contenido', 'tags', 'activo']:
        val = getattr(data, field, None)
        if val is not None:
            setattr(art, field, val)
    db.commit()
    db.refresh(art)
    return art


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_article(
    article_id: str,
    db: Session = Depends(get_db),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    art = db.query(models.DBKBArticle).filter(models.DBKBArticle.id == article_id).first()
    if not art:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    db.delete(art)
    db.commit()
