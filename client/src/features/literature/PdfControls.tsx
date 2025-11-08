import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { j } from "../../api/base";
import { useSession } from "../../state/sessionStore";

export default function PdfControls() {
  const qc = useQueryClient();
  const { currentSourceId, setCurrentSourceId } = useSession();

  const pdfsQ = useQuery({
    queryKey:["pdfs"],
    queryFn: () => j<{source_id:string; title:string; file_url:string}[]>(fetch("/api/literature/pdfs"))
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return j<{source_id:string; file_url:string}>(fetch("/api/literature/upload", { method: "POST", body: fd }));
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey:["pdfs"] });
      setCurrentSourceId(r.source_id);
    }
  });

  return (
    <div>
      <div style={{fontWeight:600, marginBottom:"6px"}}>Paper</div>
      <select value={currentSourceId ?? ""} onChange={(e)=>setCurrentSourceId(e.target.value)} className="input" style={{width:"100%"}}>
        <option value="" disabled>Select…</option>
        {(pdfsQ.data||[]).map(p => (
          <option key={p.source_id} value={p.source_id}>{p.title}</option>
        ))}
      </select>
      <div style={{marginTop:"8px"}}>
        <label className="btn" style={{display:"inline-block"}}>
          Upload PDF
          <input type="file" accept="application/pdf" hidden onChange={(e)=>{ const f = e.target.files?.[0]; if (f) upload.mutate(f); }}/>
        </label>
      </div>
      <small style={{display:"block", color:"var(--muted)", marginTop:"6px"}}>Select or upload; PDF renders in the main body.</small>
    </div>
  );
}
