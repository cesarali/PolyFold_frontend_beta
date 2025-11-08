from fastapi import APIRouter
from fastapi.responses import Response
from ..models import ChemicalStructure, Property, Run
from pathlib import Path
import uuid
router = APIRouter()
STATIC = Path(__file__).resolve().parents[1] / "static"
@router.get("/workers")
def workers():
    items = [
        {"method_id":"chem.mol/etkdg-mmff@v1","arity":1,"roles":["structure"],"category":"geometry.conformer"},
        {"method_id":"fast_structure/pack_pose_xyz@v1","arity":2,"roles":["A","B"],"category":"packing.pose"},
        {"method_id":"qm/xtb_sp@v1","arity":1,"roles":["structure"],"category":"energy.single_point"},
        {"method_id":"qm/xtb_sp_complex_xyz@v1","arity":1,"roles":["complex.xyz"],"category":"energy.single_point"},
        {"method_id":"qm/deltaE@v1","arity":1,"roles":["energies"],"category":"energy.aggregation"},
    ]
    return items
@router.get("/structures")
def structures(tag: str | None = None):
    def mk(name, smiles, tags):
        return ChemicalStructure(
            chemical_structure_id="CS_"+uuid.uuid4().hex[:6],
            inchikey="IK_"+uuid.uuid4().hex[:14].upper(),
            smiles=smiles,
            synonyms=[name],
            tags=tags
        ).model_dump()
    pool = [
        mk("4-VP", "C=CC1=CC=NC=C1", ["monomer"]),
        mk("AA", "C=CC(=O)O", ["monomer"]),
        mk("Template_Estradiol", "C1CC2CCC3C(C1)CCC4=CC(=O)CCC234", ["template"]),
        mk("Porogen_Toluene", "CC1=CC=CC=C1", ["porogen"]),
    ]
    if tag:
        return [p for p in pool if tag in p["tags"]]
    return pool
@router.post("/runs")
def create_run(payload: dict):
    run = Run(run_id="RUN_"+uuid.uuid4().hex[:8], name="physics-engine", status="running")
    steps = [{"run_step_id":"ST_"+uuid.uuid4().hex[:6], "run_id":run.run_id, "method_id":m, "status":"queued"} for m in payload.get("workers", [])]
    return {"run": run.model_dump(), "steps": steps}
@router.get("/properties")
def props():
    items = [Property(
        property_id="PR_"+uuid.uuid4().hex[:10],
        name="qm/deltaE@v1", cache_key=uuid.uuid4().hex,
        value=-22.4, units="kJ/mol", category="energy.aggregation", context="complex-level",
        qualifiers={"artifacts":{"pose_xyz_paths":["/static/sample.xyz"]}}
    ).model_dump()]
    return {"properties": items}
@router.get("/complex.xyz")
def complex_xyz():
    return Response((STATIC / "sample.xyz").read_text(), media_type="text/plain")
