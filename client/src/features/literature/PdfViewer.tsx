import { Document, Page, pdfjs } from "react-pdf";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.js?url";
import { useSession } from "../../state/sessionStore";
import { useEffect, useMemo, useState } from "react";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

export default function PdfViewer() {
  const { currentSourceId } = useSession();
  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [docError, setDocError] = useState<string | null>(null);

  const url = useMemo(() => (
    currentSourceId ? `/api/literature/pdfs/${currentSourceId}/content` : null
  ), [currentSourceId]);

  useEffect(() => { setDocError(null); setPage(1); setNumPages(0); }, [url]);

  if (!url) {
    return <div style={{padding:"12px", color:"var(--muted)"}}>Pick or upload a PDF from the right panel.</div>;
  }

  return (
    <div style={{display:"grid", gridTemplateRows:"40px 1fr", height:"100%"}}>
      <div style={{display:"flex", alignItems:"center", gap:"8px"}}>
        <button className="btn" onClick={()=>setPage((p)=> Math.max(1, p-1))} disabled={page<=1}>Prev</button>
        <button className="btn" onClick={()=>setPage((p)=> Math.min(numPages || 1, p+1))} disabled={page >= (numPages || 1)}>Next</button>
        <span style={{color:"var(--muted)"}}>Page {Math.min(page, Math.max(1, numPages || 1))} / {numPages || 1}</span>
      </div>

      <div style={{overflow:"auto"}}>
        {docError ? (
          <>
            <div style={{padding:12, color:"var(--muted)"}}>
              Viewer had trouble rendering: <code>{docError}</code>. Falling back to inline preview…
            </div>
            <iframe title="pdf-fallback" src={url} style={{width:"100%", height:"80vh", border:"0"}} />
          </>
        ) : (
          <Document
            file={url}
            onLoadSuccess={(e)=> setNumPages(e.numPages)}
            onLoadError={(e)=> setDocError(String(e))}
            loading={<div style={{padding:12}}>Loading PDF…</div>}
            error=""
            noData={<div style={{padding:12}}>No PDF data received.</div>}
          >
            <Page pageNumber={page} width={920} renderTextLayer renderAnnotationLayer />
          </Document>
        )}
      </div>
    </div>
  );
}
