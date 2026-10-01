import os
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

# Ensure parent directory is in path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.agents.discovery_agent import discovery_agent
from backend.services.molecule_service import molecule_service
from backend.services.gemini_service import gemini_service
from backend.config import settings

app = FastAPI(title="Breka AI - Autonomous Scientific Discovery Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic Models ──────────────────────────────────────
class DiscoverRequest(BaseModel):
    query: str

class ReportRequest(BaseModel):
    molecule_data: dict


# ─── API Endpoints ─────────────────────────────────────────
@app.post("/api/discover")
async def discover(req: DiscoverRequest):
    """Main discovery endpoint — takes a natural language query and returns
    AI-generated candidate molecules with full analysis."""
    try:
        result = await discovery_agent.discover(req.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/molecule/{smiles:path}")
async def get_molecule(smiles: str):
    """Get 3D structure and computed properties for a SMILES string."""
    if not molecule_service.validate_smiles(smiles):
        raise HTTPException(status_code=400, detail="Invalid SMILES")

    props = molecule_service.calculate_properties(smiles)
    lipinski = molecule_service.check_lipinski(props)
    molblock = molecule_service.get_3d_molblock(smiles)
    svg = molecule_service.smiles_to_svg(smiles)
    return {
        "smiles": smiles,
        "properties": props,
        "lipinski": lipinski,
        "3d_molblock": molblock,
        "2d_svg": svg,
    }


@app.post("/api/report")
async def generate_report(req: ReportRequest):
    """Generate a patent-style scientific report for a molecule."""
    try:
        draft = gemini_service.generate_patent_draft(req.molecule_data)
        return draft
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health():
    return {"status": "ok", "platform": "Breka AI", "version": "1.0.0"}


# ─── Serve Frontend ───────────────────────────────────────
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
if FRONTEND_DIR.exists():
    app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")
    app.mount("/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="js")
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")

    @app.get("/")
    async def serve_frontend():
        return FileResponse(str(FRONTEND_DIR / "index.html"))


# ─── Runner ────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
