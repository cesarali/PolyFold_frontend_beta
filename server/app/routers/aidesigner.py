from __future__ import annotations

import csv
import random
import uuid
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from fastapi import APIRouter

from ..models import Run


router = APIRouter()


DATASET_PATH = Path(__file__).resolve().parent.parent / "static" / "PI1M_sample.csv"


def _coerce_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        stripped = value.strip()
        if stripped == "":
            return None
        try:
            return float(stripped)
        except ValueError:
            try:
                # Try again removing thousands separators
                return float(stripped.replace(",", ""))
            except ValueError:
                return None
    return None


def _normalise_key(name: str) -> str:
    return "".join(ch for ch in name.lower() if ch.isalnum())


def _match_column(columns: Iterable[str], target: str) -> Optional[str]:
    normalised_target = _normalise_key(target)
    for column in columns:
        if _normalise_key(column) == normalised_target:
            return column
    for column in columns:
        if normalised_target in _normalise_key(column):
            return column
    return None


def _extract_value(row: Dict[str, Any], *keywords: str, numeric: bool = False) -> Optional[Any]:
    keywords_lower = [k.lower() for k in keywords]
    for key, value in row.items():
        lowered = key.lower()
        if all(keyword in lowered for keyword in keywords_lower):
            if numeric:
                return _coerce_float(value)
            return value
    return None


@lru_cache(maxsize=1)
def _load_dataset() -> List[Dict[str, Any]]:
    if not DATASET_PATH.exists():
        return []
    with DATASET_PATH.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        return [row for row in reader if any(row.values())]


def _row_to_candidate(row: Dict[str, Any]) -> Dict[str, Any]:
    monomer_smiles = _extract_value(row, "monomer", "smiles") or _extract_value(row, "smiles")
    linker_smiles = _extract_value(row, "linker", "smiles")

    monomer_inchikey = _extract_value(row, "monomer", "inchikey") or "IK_" + uuid.uuid4().hex[:10]
    linker_inchikey = _extract_value(row, "linker", "inchikey") or "IK_" + uuid.uuid4().hex[:10]

    estimated_delta = (
        _extract_value(row, "deltae", numeric=True)
        or _extract_value(row, "energy", numeric=True)
        or _extract_value(row, "kjmol", numeric=True)
    )

    candidate: Dict[str, Any] = {
        "monomer": {"inchikey": monomer_inchikey, "smiles": monomer_smiles or ""},
        "linker": {"inchikey": linker_inchikey, "smiles": linker_smiles or ""},
        "estimated_deltaE_kJmol": estimated_delta,
    }

    numeric_properties: Dict[str, float] = {}
    for key, value in row.items():
        coerced = _coerce_float(value)
        if coerced is not None:
            numeric_properties[key] = coerced

    if numeric_properties:
        candidate["properties"] = numeric_properties

    return candidate


def _select_random_rows(rows: List[Dict[str, Any]], count: int) -> List[Dict[str, Any]]:
    if not rows:
        return []
    if len(rows) >= count:
        return random.sample(rows, count)
    return random.choices(rows, k=count)


def _compute_property_summary(
    rows: List[Dict[str, Any]],
    targets: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    if not targets:
        return []

    columns = rows[0].keys() if rows else []
    summary: List[Dict[str, Any]] = []

    for target in targets:
        kind = target.get("kind")
        if not kind:
            continue

        column = _match_column(columns, kind) if rows else None
        total = 0.0
        contribution_count = 0

        if column:
            for row in rows:
                value = _coerce_float(row.get(column))
                if value is None:
                    continue
                total += value
                contribution_count += 1
        else:
            provided = _coerce_float(target.get("value"))
            if provided is not None:
                total = provided

        summary.append(
            {
                "kind": kind,
                "sum": total,
                "double": total * 2,
                "count": contribution_count,
            }
        )

    return summary


@router.post("/propose")
def propose(payload: Dict[str, Any]):
    dataset_rows = _load_dataset()
    requested_targets = payload.get("targets") or []

    selected_rows = _select_random_rows(dataset_rows, 4)

    if selected_rows:
        candidates = [_row_to_candidate(row) for row in selected_rows]
    else:
        candidates = [
            {
                "monomer": {"inchikey": "IK_" + uuid.uuid4().hex[:10], "smiles": "C=CC(=O)N"},
                "linker": {"inchikey": "IK_" + uuid.uuid4().hex[:10], "smiles": "C=C(C)C(=O)O"},
                "estimated_deltaE_kJmol": -18.7,
            },
            {
                "monomer": {"inchikey": "IK_" + uuid.uuid4().hex[:10], "smiles": "C=CCN"},
                "linker": {"inchikey": "IK_" + uuid.uuid4().hex[:10], "smiles": "C=C"},
                "estimated_deltaE_kJmol": -22.1,
            },
        ]

    property_summary = _compute_property_summary(selected_rows, requested_targets)

    run = Run(run_id="RUN_" + uuid.uuid4().hex[:8], name="ai-designer-proposal", status="done")

    return {
        "run": run.model_dump(),
        "candidates": candidates,
        "template": payload.get("template"),
        "property_summary": property_summary,
        "targets": requested_targets,
    }
