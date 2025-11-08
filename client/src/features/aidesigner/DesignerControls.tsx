import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { j } from "../../api/base";
import { useDesigner } from "../../state/designerStore";

export default function DesignerControls() {
  const [template, setTemplate] = useState("O");
  const [target, setTarget] = useState("-20");
  const { setResult } = useDesigner();
  const mut = useMutation({
    mutationFn: () => j<any>(fetch("/api/ai-designer/propose", { method:"POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ template, targets: [{ kind:"deltaE_kJmol", value: parseFloat(target) }] }) })),
    onSuccess: (r)=> setResult(r)
  });
  return (
    <form onSubmit={(e)=>{ e.preventDefault(); mut.mutate(); }}>
      <label>Template (SMILES)</label>
      <input className="input" value={template} onChange={e=>setTemplate(e.target.value)} style={{width:"100%"}} />
      <label style={{marginTop:"8px", display:"block"}}>Target ΔE (kJ/mol)</label>
      <input className="input" value={target} onChange={e=>setTarget(e.target.value)} style={{width:"100%"}} />
      <div style={{marginTop:"8px"}}><button className="btn" type="submit">Propose</button></div>
    </form>
  );
}
