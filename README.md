# PolyFold_RX v2.1 — PDF fixed (direct URL), modular routers

## Server
cd server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

## Client
cd client
npm i
npm run dev

### PDF flow
- Right panel → Upload PDF → viewer selects it automatically.
- Viewer uses direct URL `/api/literature/pdfs/{source_id}/content`.
- Worker loaded via: `import workerSrc from "pdfjs-dist/build/pdf.worker.min.js?url";`
