# DEVELOPER_GUIDE.md — PolyFold_RX UI/API for Extensions

This guide is written so **another AI agent or developer** can extend the app safely and quickly.

---

## A. Core domain contracts (Pydantic → UI)

Authoritative models live in `server/app/models.py`:

```py
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional, Literal
import datetime as dt

class Run(BaseModel):
    run_id: str
    name: str
    status: Literal["running","done","failed","partial"]
    method_graph: List[str] = []
    selector: Dict[str, Any] = {}
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

class Property(BaseModel):
    property_id: str
    name: str
    cache_key: str
    value: Optional[float]
    units: Optional[str]
    category: str
    context: str
    qualifiers: Dict[str, Any] = {}   # artifacts here (e.g. pose_xyz_paths)
    provenance: Dict[str, Any] = {}
    confidence: float = 1.0
```

UI components assume these shapes; any backend replacement should preserve keys.

---

## B. HTTP API surface (mocked; swap with real later)

### Literature (`/api/literature`)
- `GET /pdfs` → `[{source_id, title, file_url}]`
- `POST /upload` (multipart/form-data) → `{source_id, file_url}`
- `GET /pdfs/{source_id}/content` → `application/pdf` (maps `uploaded_*` → `/static/upload_*.pdf`)
- `GET /pdfs/{source_id}/canonical-properties` → `Property[]` (mock schema validation output)

### AI Designer (`/api/ai-designer`)
- `POST /propose` `{template, targets:[{kind:'deltaE_kJmol', value}]}` →  
  `{ run:Run, candidates:[{monomer, linker, estimated_deltaE_kJmol}] }`

### Physics (`/api/physics`)
- `GET /workers` → worker methods (IDs match orchestrator)
- `GET /structures?tag=monomer|template|porogen` → `ChemicalStructure[]`
- `POST /runs` `{ template, monomers:[], porogen, workers:[] }` → `{ run:Run, steps:[…] }`
- `GET /properties` → `{ properties: Property[] }`
- `GET /complex.xyz` → XYZ text (for 3Dmol viewer)

### Copilot (`/api/chat`)
- `GET /stream?text=...` → `text/event-stream` (mock responses)

---

## C. UI state & data flow

- **Zustand stores**
  - `uiStore`: open/close left/right panels.
  - `sessionStore`: `currentSourceId` (active paper).
  - `designerStore`: last AI Designer result.
  - `physicsStore`: template/porogen/monomer/worker selections + `lastRun`.

- **Right panel drives the body**  
  Each role’s *Controls* (right panel) set state and call APIs. Body pages subscribe to stores and queries to render results.

- **Fetching helper**  
  `src/api/base.ts` has `j<Response|Promise<Response>>` to do `j(fetch(...))` safely.

- **PDF viewer**  
  Uses `react-pdf` with Vite‑imported worker and logs; includes `<iframe>` fallback.

---

## D. Extension examples

### D1. Add options to **AI Designer** (e.g., families, solvent, constraints)

**Backend** — extend payload & echo back options:
```py
# server/app/routers/aidesigner.py
@router.post("/propose")
def propose(payload: dict):
    options = payload.get("options", {})
    # ...use options to shape candidate generation...
    return {"run": run.model_dump(), "candidates": candidates, "template": payload.get("template"), "options": options}
```

**Frontend** — add fields to `DesignerControls.tsx`:
```tsx
// local state
const [families, setFamilies] = useState<string[]>([]);
const [linkerFamily, setLinkerFamily] = useState<string>("EGDMA");
const [solvent, setSolvent] = useState<string>("toluene");
const [maxCandidates, setMaxCandidates] = useState<number>(10);

// POST body
body: JSON.stringify({
  template,
  targets: [{ kind:"deltaE_kJmol", value: parseFloat(target) }],
  options: { monomer_families: families, linker_family: linkerFamily, solvent, max_candidates: maxCandidates }
})
```
Render returned `options` in `ProposalsBody` if you want transparency.

### D2. Add a **new Role**
1) **Backend:** create `server/app/routers/<role>.py`; register in `app/main.py`.  
2) **Frontend:** add `features/<role>/` with `<Role>Page.tsx` and `<Role>Controls.tsx`.  
3) Add route in `main.tsx`, link in `app/App.tsx`, and `RightSidebar.tsx` branch.  
4) If global selections are needed, add a new `zustand` store in `src/state`.

---

## E. Styling & layout rules

- Keep components small; split by feature: `features/<role>/…`.
- **Right panel** contains controls + Copilot.  
- **Body** renders data; avoid mutating state here.  
- Keep URLs behind `/api/<router>`; no direct DB/file paths in the client.
- Artifacts live in `Property.qualifiers.artifacts.*` (SDF/XYZ etc.), aligned with orchestrator conventions.

---

## F. Logging & diagnosis

Use simple tags in the Console:
- **[PDF]** upload / select / viewer / errors
- **[AI]** request / response
- **[PHYS]** selections / run submission / results

DevTools → Network: filter by `api/…` to inspect requests.

---

## G. Mock → Real migration

- Replace router internals to call your orchestrator + MongoDB(s).  
- Keep responses compatible with `models.py`.  
- For long jobs, stream run status via WS/SSE; the UI already cleanly separates Controls and Body, so adding a **Run Timeline** panel is straightforward.
