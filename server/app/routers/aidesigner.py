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


def _first_matching_value(row: Dict[str, str], keywords: Iterable[str]) -> str | None:
    for key, value in row.items():
        if value is None:
            continue
        key_lower = key.strip().lower()
        if any(keyword in key_lower for keyword in keywords):
            stripped = value.strip()
            if stripped:
                return stripped
    return None


def _extract_candidate(row: Dict[str, str]) -> Dict[str, object]:
    monomer_smiles = _first_matching_value(row, ["monomer", "monomer_smiles", "building_block_a"])
    linker_smiles = _first_matching_value(row, ["linker", "linker_smiles", "building_block_b"])

    if monomer_smiles is None and linker_smiles is None:
        # Fall back to any SMILES-like column name.
        fallback_smiles = _first_matching_value(row, ["smiles", "smile"])
        monomer_smiles = fallback_smiles
        linker_smiles = fallback_smiles

    estimated_delta_e = _first_matching_value(row, ["deltae", "energy", "kjmol"])

    try:
        estimated_delta_e_value = float(estimated_delta_e) if estimated_delta_e is not None else None
    except ValueError:
        estimated_delta_e_value = None

    def _structure_payload(smiles: str | None) -> Dict[str, str | None]:
        return {
            "inchikey": f"IK_{uuid.uuid4().hex[:10]}",
            "smiles": smiles,
        }

    return {
        "monomer": _structure_payload(monomer_smiles),
        "linker": _structure_payload(linker_smiles),
        "estimated_deltaE_kJmol": estimated_delta_e_value,
    }


def _summarize_targets(targets: Iterable[Dict[str, object]]) -> List[Dict[str, object]]:
    aggregated: Dict[str, float] = {}
    for target in targets:
        kind = str(target.get("kind", "")).strip()
        if not kind:
            continue
        try:
            value = float(target.get("value"))
        except (TypeError, ValueError):
            continue
        aggregated[kind] = aggregated.get(kind, 0.0) + value

    summaries = []
    for kind, total in aggregated.items():
        summaries.append({
            "kind": kind,
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
