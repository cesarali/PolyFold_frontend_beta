from typing import Any, Dict, List
import uuid

from fastapi import APIRouter

from ..models import Run

router = APIRouter()


def _coerce_number(value: Any) -> Any:
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return value


def _build_property_entries(requested: Dict[str, Any]) -> List[Dict[str, Any]]:
    property_specs = [
        ("Mw", "Mw", "g/mol"),
        ("LogP", "LogP", ""),
        ("TPSA", "TPSA", "Å²"),
        ("NumRings", "Number of Rings", ""),
        ("NumRotatableBonds", "Number of Rotatable Bonds", ""),
    ]
    entries: List[Dict[str, Any]] = []
    for key, label, units in property_specs:
        entries.append(
            {
                "property_id": f"prop_{key.lower()}",
                "name": label,
                "value": _coerce_number(requested.get(key)),
                "units": units,
                "context": "Constraint",
            }
        )
    return entries


@router.post("/propose")
def propose(payload: dict):
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

    run = Run(run_id="RUN_" + uuid.uuid4().hex[:8], name="ai-designer-proposal", status="done")

    requested_properties = payload.get("properties") or {}
    properties = [
        {
            "property_id": "prop_deltae_target",
            "name": "ΔE target",
            "value": next(
                (t.get("value") for t in payload.get("targets", []) if isinstance(t, dict) and t.get("kind") == "deltaE_kJmol"),
                None,
            ),
            "units": "kJ/mol",
            "context": "Target constraint",
        }
    ]
    properties.extend(_build_property_entries(requested_properties))

    return {
        "run": run.model_dump(),
        "candidates": candidates,
        "template": payload.get("template"),
        "properties": properties,
    }
