from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional, Literal
import datetime as dt
class Run(BaseModel):
    run_id: str
    name: str
    method_graph: List[str] = []
    selector: Dict[str, Any] = {}
    status: Literal["running","done","failed","partial"] = "running"
    counters: Dict[str, int] = {"created":0,"skipped":0,"errors":0}
    started_at: str = Field(default_factory=lambda: dt.datetime.utcnow().isoformat()+"Z")
    finished_at: Optional[str] = None
    provenance: Dict[str, Any] = {}
class ChemicalStructure(BaseModel):
    chemical_structure_id: str
    inchikey: str
    smiles: str
    synonyms: List[str] = []
    tags: List[str] = []
    created_at: str = Field(default_factory=lambda: dt.datetime.utcnow().isoformat()+"Z")
    updated_at: str = Field(default_factory=lambda: dt.datetime.utcnow().isoformat()+"Z")
class Property(BaseModel):
    property_id: str
    name: str
    cache_key: str
    value: Optional[float] = None
    units: Optional[str] = None
    category: str
    context: str
    qualifiers: Dict[str, Any] = {}
    provenance: Dict[str, Any] = {}
    confidence: float = 1.0
    created_at: str = Field(default_factory=lambda: dt.datetime.utcnow().isoformat()+"Z")
