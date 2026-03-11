from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app import models
from app.routers import (
    auth, conversations, metrics, pricing,
    agents_admin, users_admin, whatsapp, notifications,
    knowledge_base, campaigns, ai_router, flow_builder,
    organizations, integrations, settings, documents,
    profile, training, routing_config, export,
)
import json
from typing import List

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="COMFAGUAJIRA Chatbot API",
    description="Plataforma omnicanal de atención al afiliado — API v3",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:4173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
for router in [
    auth.router, conversations.router, metrics.router, pricing.router,
    agents_admin.router, users_admin.router, whatsapp.router, notifications.router,
    knowledge_base.router, campaigns.router, ai_router.router, flow_builder.router,
    organizations.router, integrations.router, settings.router, documents.router,
    profile.router, training.router, routing_config.router, export.router,
]:
    app.include_router(router)


@app.get("/health", tags=["health"])
def health():
    return {
        "status": "ok",
        "service": "comfaguajira-chatbot-api",
        "version": "3.0.0",
        "modules": [
            "auth", "conversations", "metrics", "pricing",
            "agents", "users", "whatsapp", "notifications",
            "knowledge-base", "campaigns", "ai", "flows",
            "organizations", "integrations", "settings", "documents",
            "profile", "training", "routing", "export",
        ],
    }


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        await websocket.send_text(json.dumps({
            "event": "connected",
            "connections": len(self.active_connections),
        }))

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead = []
        for conn in self.active_connections:
            try:
                await conn.send_text(json.dumps(message))
            except Exception:
                dead.append(conn)
        for d in dead:
            if d in self.active_connections:
                self.active_connections.remove(d)

    async def send_personal(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception:
            self.disconnect(websocket)


manager = ConnectionManager()
app.state.ws_manager = manager


@app.websocket("/ws/inbox")
async def websocket_inbox(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                await manager.broadcast(json.loads(data))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
