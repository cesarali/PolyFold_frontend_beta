from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routers import literature, aidesigner, physics, chat
from pathlib import Path
app = FastAPI(title="PolyFold_RX Mock API v2.1")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
static_dir = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
app.include_router(literature.router, prefix="/api/literature", tags=["literature"])
app.include_router(aidesigner.router, prefix="/api/ai-designer", tags=["ai-designer"])
app.include_router(physics.router, prefix="/api/physics", tags=["physics"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
