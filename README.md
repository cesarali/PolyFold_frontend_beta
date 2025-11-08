# PolyFold_RX — Mock UI + API (v2.1+)

Dark, Copilot‑style app for three roles:

1) **Literature review** — upload/select a PDF (right panel), view it in the body, inspect canonical properties.  
2) **AI Designer** — propose monomer/linker combinations from a template + targets.  
3) **Physics Engine** — pick template/porogen/monomer & workers, submit runs; view structures and energies.

> This scaffold uses **mock data** with real contracts so you can swap in your orchestrator & databases later.

---

## 1) Requirements

- **Node.js** 18+ (recommended 20+)
- **Python** 3.10–3.12
- **pip** and `venv`

---

## 2) Getting started

### Server (FastAPI)

```bash
cd server
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt

uvicorn app.main:app --reload
# -> serves at http://localhost:8000
# Static: http://localhost:8000/static/
```

### Client (Vite + React)

```bash
cd client
npm i
npm run dev
# -> http://localhost:5173
```

The client dev server proxies `/api` and `/static` to FastAPI.

---

## 3) Project structure

```
PolyFold_RX/
├─ client/
│  ├─ index.html
│  ├─ vite.config.ts
│  ├─ package.json
│  └─ src/
│     ├─ app/
│     │  ├─ App.tsx            # layout shell: left roles, body, right controls+copilot
│     │  └─ theme.css          # sober dark palette
│     ├─ components/
│     │  ├─ TopBar.tsx
│     │  ├─ RightSidebar.tsx   # role-aware controls (top) + Copilot (bottom)
│     │  └─ copilot/Copilot.tsx
│     ├─ features/
│     │  ├─ literature/
│     │  │  ├─ LiteraturePage.tsx      # body: PDF + canonical props
│     │  │  ├─ PdfControls.tsx         # right: select & upload & validate
│     │  │  ├─ PdfViewer.tsx           # uses react-pdf (+ iframe fallback)
│     │  │  └─ SchemaInspector.tsx
│     │  ├─ aidesigner/
│     │  │  ├─ AIDesignerPage.tsx      # body: proposals
│     │  │  ├─ DesignerControls.tsx    # right: template & targets
│     │  │  └─ ProposalsBody.tsx
│     │  └─ physics/
│     │     ├─ PhysicsEnginePage.tsx   # body: 3D viewer + energies table
│     │     ├─ PhysicsControls.tsx     # right: template/porogen/monomer & workers & submit
│     │     └─ MoleculeViewer3D.tsx
│     ├─ api/
│     │  └─ base.ts            # j<Response|Promise<Response>> JSON helper
│     ├─ state/
│     │  ├─ uiStore.ts         # left/right panel
│     │  ├─ sessionStore.ts    # currentSourceId (PDF)
│     │  ├─ designerStore.ts   # AI Designer results
│     │  └─ physicsStore.ts    # selections + lastRun
│     └─ main.tsx              # router + React Query provider
└─ server/
   ├─ requirements.txt
   └─ app/
      ├─ main.py               # FastAPI app, mounts /static, includes routers
      ├─ models.py             # Pydantic (Run, ChemicalStructure, Property)
      ├─ routers/
      │  ├─ literature.py      # /api/literature
      │  ├─ aidesigner.py      # /api/ai-designer
      │  ├─ physics.py         # /api/physics
      │  └─ chat.py            # /api/chat (SSE mock)
      └─ static/
         ├─ sample.pdf
         └─ sample.xyz
```

---

## 4) Typical flows

### Literature review
- Right panel: **Upload PDF** → sets `currentSourceId` → body loads `/api/literature/pdfs/{source_id}/content`.
- “Canonical properties” table calls `/api/literature/pdfs/{source_id}/canonical-properties`.

### AI Designer
- Right panel: enter **Template (SMILES)** + **ΔE target** → POST `/api/ai-designer/propose` → body lists candidates.

### Physics Engine
- Right panel: choose **Template / Porogen / Monomer(s)** + **Workers** → POST `/api/physics/runs` (mock run).  
- Body loads XYZ and properties via `/api/physics/complex.xyz` and `/api/physics/properties`.

---

## 5) Troubleshooting

- **PDF not rendering**
  - Ensure client depends on `pdfjs-dist@3.11.174` and `react-pdf@7.x`.
  - Console should show logs `[PDF] viewer loading:` and `loaded pages:`.  
  - If pdf.js fails, the viewer auto-falls back to an inline `<iframe>`.

- **No server responses**
  - Confirm `uvicorn app.main:app --reload` and that the client’s proxy points to `http://localhost:8000`.
