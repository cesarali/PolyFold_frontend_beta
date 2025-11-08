from __future__ import annotations

import csv
import random
import uuid
from pathlib import Path
from typing import Dict, List

from fastapi import APIRouter, HTTPException

from ..models import Run

try:  # pragma: no cover - optional dependency
    from rdkit import Chem  # type: ignore
    from rdkit.Chem import Descriptors, rdMolDescriptors  # type: ignore
except ImportError:  # pragma: no cover - optional dependency
    Chem = None  # type: ignore
    Descriptors = None  # type: ignore
    rdMolDescriptors = None  # type: ignore


router = APIRouter()

_SMILES_CACHE: List[str] = []


def _load_smiles() -> List[str]:
    global _SMILES_CACHE
    if _SMILES_CACHE:
        return _SMILES_CACHE

    csv_path = Path(__file__).resolve().parents[1] / "static" / "PI1M_sample.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=500, detail="PI1M_sample.csv not found")

    with csv_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        _SMILES_CACHE = [row["smiles"].strip() for row in reader if row.get("smiles")]

    if not _SMILES_CACHE:
        raise HTTPException(status_code=500, detail="No SMILES entries available")

    return _SMILES_CACHE


def _mock_properties() -> Dict[str, float]:
    return {
        "Mw": round(random.uniform(100, 600), 2),
        "LogP": round(random.uniform(-2, 8), 2),
        "TPSA": round(random.uniform(0, 200), 2),
        "NumRings": random.randint(0, 6),
        "NumRotatableBonds": random.randint(0, 12),
    }


def _compute_properties(smiles: str) -> Dict[str, float]:
    if Chem is None:
        return _mock_properties()

    try:
        mol = Chem.MolFromSmiles(smiles)
    except Exception:  # pragma: no cover - defensive
        mol = None

    if mol is None:
        return _mock_properties()

    try:
        properties = {
            "Mw": round(float(Descriptors.MolWt(mol)), 2),
            "LogP": round(float(Descriptors.MolLogP(mol)), 2),
            "TPSA": round(float(Descriptors.TPSA(mol)), 2),
            "NumRings": int(rdMolDescriptors.CalcNumRings(mol)),
            "NumRotatableBonds": int(rdMolDescriptors.CalcNumRotatableBonds(mol)),
        }
    except Exception:  # pragma: no cover - fallback for computation issues
        properties = _mock_properties()

    return properties


@router.post("/propose")
def propose(payload: Dict) -> Dict[str, object]:
    smiles_list = _load_smiles()
    selected_smiles = random.choice(smiles_list)

    candidate = {
        "monomer": {"smiles": selected_smiles},
        "estimated_deltaE_kJmol": round(random.uniform(-30.0, -5.0), 2),
        "properties": _compute_properties(selected_smiles),
    }

    run = Run(
        run_id="RUN_" + uuid.uuid4().hex[:8],
        name="ai-designer-proposal",
        status="done",
    )

    return {
        "run": run.model_dump(),
        "candidates": [candidate],
        "template": payload.get("template"),
    }
