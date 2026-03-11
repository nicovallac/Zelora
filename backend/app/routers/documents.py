from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models
from app.deps import get_current_agent
import uuid
import os

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = "/tmp/comfaguajira_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".doc", ".xlsx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    article_id: str = Form(None),
    _agent: models.DBAgent = Depends(get_current_agent),
):
    """Upload a document for RAG indexing."""
    # Validate extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no permitido. Usa: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="El archivo excede el límite de 10MB")

    # Save file
    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    with open(file_path, "wb") as f:
        f.write(content)

    # In production: trigger Celery task for text extraction + embedding
    # For PoC: simulate processing
    word_count = len(content.decode("utf-8", errors="ignore").split()) if ext == ".txt" else len(content) // 5
    chunk_count = max(1, word_count // 200)

    return {
        "id": doc_id,
        "filename": file.filename,
        "size_bytes": len(content),
        "extension": ext,
        "article_id": article_id,
        "status": "procesado",
        "word_count": word_count,
        "chunks_indexed": chunk_count,
        "message": f"Documento '{file.filename}' procesado e indexado. {chunk_count} fragmentos añadidos a la base de conocimiento.",
    }


@router.get("/{article_id}")
def list_article_documents(
    article_id: str,
    _agent: models.DBAgent = Depends(get_current_agent),
):
    """List documents attached to a KB article."""
    # Mock response - in production query a DBDocument table
    return [
        {"id": "doc1", "filename": "reglamento_subsidios_2026.pdf", "size_bytes": 245760, "chunks": 48, "status": "indexado"},
        {"id": "doc2", "filename": "manual_afiliados.pdf", "size_bytes": 189440, "chunks": 32, "status": "indexado"},
    ]


@router.delete("/{document_id}", status_code=204)
def delete_document(
    document_id: str,
    _agent: models.DBAgent = Depends(get_current_agent),
):
    pass
