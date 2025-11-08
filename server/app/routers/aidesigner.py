from __future__ import annotations

import csv
import random
import uuid
from pathlib import Path
from typing import Dict, Iterable, List

from fastapi import APIRouter, HTTPException

from ..models import Run

router = APIRouter()

CSV_FILENAME = "PI1M_sample.csv"
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

TARGET_PROPERTIES: Dict[str, str] = {
    "deltaE_kJmol": "ΔE (kJ/mol)",
    "Mw": "Mw (g/mol)",
    "LogP": "LogP",
    "TPSA": "TPSA (Å²)",
    "NumRings": "NumRings",
    "NumRotatableBonds": "NumRotatableBonds",
}


def _load_dataset_rows() -> List[Dict[str, str]]:
    dataset_path = STATIC_DIR / CSV_FILENAME
    if not dataset_path.exists():
        raise HTTPException(status_code=500, detail=f"Dataset '{CSV_FILENAME}' not found in static assets.")

    with dataset_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        rows = [row for row in reader if any(value for value in row.values())]

    if not rows:
        raise HTTPException(status_code=500, detail="Dataset is empty; unable to generate proposals.")

    return rows


def _extract_candidate(row: Dict[str, str]) -> Dict[str, object]:
    smiles = None
    for value in row.values():
        if value is None:
            continue
        stripped = value.strip()
        if stripped:
            smiles = stripped
            break

    def _structure_payload(structure_smiles: str | None) -> Dict[str, str | None]:
        return {
            "inchikey": f"IK_{uuid.uuid4().hex[:10]}",
            "smiles": structure_smiles,
        }

    return {
        "monomer": _structure_payload(smiles),
        "linker": _structure_payload(None),
        "estimated_deltaE_kJmol": None,
    }


def _summarize_targets(targets: Iterable[Dict[str, object]]) -> List[Dict[str, object]]:
    summaries: List[Dict[str, object]] = []

    for key in TARGET_PROPERTIES:
        total = 0.0
        seen_value = False

        for target in targets:
            if str(target.get("kind", "")).strip() != key:
                continue
            try:
                value = float(target.get("value"))
            except (TypeError, ValueError):
                continue
            total += value
            seen_value = True

        if seen_value:
            summaries.append({
                "kind": key,
                "sum": total,
                "doubled": total * 2,
            })

    return summaries


@router.post("/propose")
def propose(payload: dict):
    rows = _load_dataset_rows()
    selection_size = min(4, len(rows))
    random_rows = random.sample(rows, selection_size) if selection_size else []
    candidates = [_extract_candidate(row) for row in random_rows]

    run = Run(run_id="RUN_" + uuid.uuid4().hex[:8], name="ai-designer-proposal", status="done")

    template = payload.get("template")
    targets = payload.get("targets", [])
    property_summary = _summarize_targets(targets if isinstance(targets, list) else [])

    return {
        "run": run.model_dump(),
        "candidates": candidates,
        "template": template,
        "property_summary": property_summary,
    }
