from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
import uuid

router = APIRouter()
STATIC = Path(__file__).resolve().parents[1] / "static"
PDFS = STATIC


@router.get("/pdfs")
def list_pdfs():
    return [
        {
            "source_id": "doi_sample_1",
            "title": "Sample MIP Paper (mock)",
            "file_url": "/static/sample.pdf",
        },
        {
            "source_id": "doi_sample_2",
            "title": "Another Paper (mock)",
            "file_url": "/static/sample.pdf",
        },
    ]


@router.get("/pdfs/{source_id}/content")
def pdf_content(source_id: str):
    if source_id.startswith("uploaded_"):
        stem = source_id.replace("uploaded_", "")  # 'upload_<hash>'
        fpath = STATIC / f"{stem}.pdf"
        if fpath.exists():
            return FileResponse(
                fpath, media_type="application/pdf", filename=fpath.name
            )
    return FileResponse(
        STATIC / "sample.pdf", media_type="application/pdf", filename="sample.pdf"
    )


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    target = PDFS / f"upload_{uuid.uuid4().hex[:8]}.pdf"
    data = await file.read()
    if not data:
        data = (STATIC / "sample.pdf").read_bytes()
    target.write_bytes(data)
    return {
        "source_id": f"uploaded_{target.stem}",
        "file_url": f"/static/{target.name}",
    }


@router.get("/pdfs/{source_id}/canonical-properties")
def canonical_props(source_id: str):
    props = [
        {
            "property_id": "prop_001",
            "name": "amount",
            "value": 470.0,
            "error": 1.45,
            "units": "µL",
            "raw_value": "470 ± 1.45 µL added to pre-complex",
            "context": "polymerization mixture",
            "category": "recipe",
            "qualifiers": {"role": "cross-linker"},
            "source_id": source_id,
            "confidence": 0.9,
        },
        {
            "property_id": "prop_002",
            "name": "monomer_ratio",
            "value": 1.0,
            "error": 0.0,
            "units": "mol/mol",
            "raw_value": "1:1",
            "context": "pre-complex",
            "category": "recipe",
            "qualifiers": {"role": "monomer"},
            "source_id": source_id,
            "confidence": 0.8,
        },
    ]
    return props
