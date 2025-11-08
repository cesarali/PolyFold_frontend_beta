from fastapi import APIRouter
from ..models import Run
import uuid
router = APIRouter()
@router.post("/propose")
def propose(payload: dict):
    candidates = [
        {"monomer":{"inchikey":"IK_"+uuid.uuid4().hex[:10],"smiles":"C=CC(=O)N"}, "linker":{"inchikey":"IK_"+uuid.uuid4().hex[:10],"smiles":"C=C(C)C(=O)O"}, "estimated_deltaE_kJmol": -18.7},
        {"monomer":{"inchikey":"IK_"+uuid.uuid4().hex[:10],"smiles":"C=CCN"}, "linker":{"inchikey":"IK_"+uuid.uuid4().hex[:10],"smiles":"C=C"}, "estimated_deltaE_kJmol": -22.1},
    ]
    run = Run(run_id="RUN_"+uuid.uuid4().hex[:8], name="ai-designer-proposal", status="done")
    return {"run": run.model_dump(), "candidates": candidates, "template": payload.get("template")}
