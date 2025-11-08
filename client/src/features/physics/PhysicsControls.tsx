import { useQuery, useMutation } from "@tanstack/react-query";
import { j } from "../../api/base";
import { usePhysics } from "../../state/physicsStore";

export default function PhysicsControls() {
  const { template, porogen, monomer, workers, setTemplate, setPorogen, setMonomer, setWorkers, setLastRun } = usePhysics();
  const workersQ = useQuery({ queryKey:["workers"], queryFn: ()=> j<any[]>(fetch("/api/physics/workers")) });
  const templQ = useQuery({ queryKey:["structures","template"], queryFn: ()=> j<any[]>(fetch("/api/physics/structures?tag=template")) });
  const porogQ = useQuery({ queryKey:["structures","porogen"], queryFn: ()=> j<any[]>(fetch("/api/physics/structures?tag=porogen")) });
  const monoQ = useQuery({ queryKey:["structures","monomer"], queryFn: ()=> j<any[]>(fetch("/api/physics/structures?tag=monomer")) });

  const submit = useMutation({
    mutationFn: () => j<any>(fetch("/api/physics/runs", { method:"POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ template, monomers: monomer ? [monomer] : [], porogen, workers }) })),
    onSuccess: (r)=> setLastRun(r)
  });

  function toggle(wid: string) {
    if (workers.includes(wid)) setWorkers(workers.filter(x => x !== wid));
    else setWorkers([...workers, wid]);
  }

  return (
    <div>
      <div style={{fontWeight:600}}>Template</div>
      <select className="input" value={template ?? ""} onChange={(e)=>setTemplate(e.target.value)} style={{width:"100%"}}>
        <option value="" disabled>Select…</option>
        {(templQ.data||[]).map((s:any)=> <option key={s.chemical_structure_id} value={s.inchikey}>{s.synonyms?.[0]||s.smiles}</option>)}
      </select>

      <div style={{fontWeight:600, marginTop:"8px"}}>Porogen</div>
      <select className="input" value={porogen ?? ""} onChange={(e)=>setPorogen(e.target.value)} style={{width:"100%"}}>
        <option value="" disabled>Select…</option>
        {(porogQ.data||[]).map((s:any)=> <option key={s.chemical_structure_id} value={s.inchikey}>{s.synonyms?.[0]||s.smiles}</option>)}
      </select>

      <div style={{fontWeight:600, marginTop:"8px"}}>Monomer</div>
      <select className="input" value={monomer ?? ""} onChange={(e)=>setMonomer(e.target.value)} style={{width:"100%"}}>
        <option value="" disabled>Select…</option>
        {(monoQ.data||[]).map((s:any)=> <option key={s.chemical_structure_id} value={s.inchikey}>{s.synonyms?.[0]||s.smiles}</option>)}
      </select>

      <div style={{fontWeight:600, marginTop:"8px"}}>Workers</div>
      <div style={{display:"grid", gap:"4px"}}>
        {(workersQ.data||[]).map((w:any)=>(
          <label key={w.method_id} style={{display:"flex", alignItems:"center", gap:"6px"}}>
            <input type="checkbox" checked={workers.includes(w.method_id)} onChange={()=>toggle(w.method_id)} />
            <span><code>{w.method_id}</code> <span style={{color:"var(--muted)"}}>({w.category})</span></span>
          </label>
        ))}
      </div>

      <div style={{marginTop:"10px"}}>
        <button className="btn" onClick={()=>submit.mutate()}>Submit job</button>
      </div>
      <small style={{display:"block", color:"var(--muted)", marginTop:"6px"}}>Long computations are mocked. Cached artifacts render in the main body.</small>
    </div>
  );
}
