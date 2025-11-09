# server/app/routers/aidesigner.py
from __future__ import annotations

import time
import uuid
from typing import Dict, List, Optional, Union

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..models import Run
from .aidesigner_helpers import (
    MODEL_NAME,
    TARGET_PROPERTIES,
    build_prompt,
    sample_texts,
    clean_text_to_smiles,
    canonize_smiles,
    compute_properties,
    summarize_candidate_properties,
)

router = APIRouter()


# --------- Request/Response schemas ---------
class TargetItem(BaseModel):
    kind: str
    value: float | int


class ProposeRequest(BaseModel):
    template: Optional[str] = None
    targets: Optional[List[Union[TargetItem, Dict[str, object]]]] = []
    options: Optional[Dict[str, object]] = {}
    n: int = 5
    # decoding knobs
    max_new_tokens: int = 128
    temperature: float = 0.9
    top_p: float = 0.95
    top_k: int = 0
    repetition_penalty: float = 1.05


@router.post("/propose")
def propose(payload: ProposeRequest):
    """
    Generates polymer candidates with PolyTao and returns:
      - the exact text prompt used,
      - raw generations,
      - extracted+canonical SMILES (when possible),
      - RDKit properties for valid SMILES,
      - property_summary derived from the ACTUAL computed properties,
      - a Run object compatible with the UI.
    """
    started = time.time()
    req = payload

    if req.n <= 0 or req.n > 50:
        raise HTTPException(
            status_code=400, detail="Parameter 'n' must be between 1 and 50."
        )

    # 1) Build EXACT prompt from inputs (this is the real context sent to the model)
    prompt = build_prompt(req.template, req.targets, req.options or {})

    # 2) Sample from the model
    try:
        raw_texts = sample_texts(
            prompt=prompt,
            n=req.n,
            max_new_tokens=req.max_new_tokens,
            temperature=req.temperature,
            top_p=req.top_p,
            top_k=req.top_k,
            repetition_penalty=req.repetition_penalty,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model generation failed: {e!r}")

    # 3) Extract SMILES + canon + properties
    candidates: List[Dict[str, object]] = []
    created = 0
    errors = 0

    for t in raw_texts:
        smi = clean_text_to_smiles(t)
        smi = canonize_smiles(smi) if smi else None
        props = compute_properties(smi) if smi else None

        if smi and props:
            created += 1
        else:
            errors += 1

        def _structure_payload(
            structure_smiles: Optional[str],
        ) -> Dict[str, Optional[str]]:
            inchikey = props.get("InchiKey") if (props and structure_smiles) else None
            if not inchikey and structure_smiles:
                inchikey = f"IK_{uuid.uuid4().hex[:16]}"
            return {"inchikey": inchikey, "smiles": structure_smiles}

        candidates.append(
            {
                "raw_text": t,
                "smiles": smi,
                "properties": props,  # may be None if invalid
                "monomer": _structure_payload(smi),
                "linker": _structure_payload(None),
                "estimated_deltaE_kJmol": None,  # not predicted here
            }
        )

    # 4) Build Run metadata
    run = Run(
        run_id=str(uuid.uuid4()),
        name="ai-designer/propose",
        status="done",
        method_graph=["polytao.sample@v1", "smiles.extract@v2", "rdkit.properties@v1"],
        selector={
            "template": req.template,
            "targets": [
                t.model_dump() if hasattr(t, "model_dump") else t
                for t in (req.targets or [])
            ],
            "options": req.options or {},
            "n": req.n,
            "model": MODEL_NAME,
        },
        counters={"created": created, "skipped": 0, "errors": errors},
        provenance={"duration_s": round(time.time() - started, 3)},
    )

    # 5) Summary derived from ACTUAL computed candidate properties
    property_summary = summarize_candidate_properties(candidates)

    return {
        "run": run.model_dump(),
        "prompt": prompt,  # exact string used as model context
        "candidates": candidates,  # raw => smiles => properties
        "options": req.options or {},
        "template": req.template,
        "targets_pretty": [
            {"key": k, "label": v} for k, v in TARGET_PROPERTIES.items()
        ],
        "property_summary": property_summary,
    }
