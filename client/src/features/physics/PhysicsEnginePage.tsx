import { useQuery } from "@tanstack/react-query";
import { j } from "../../api/base";
import MoleculeViewer3D from "./MoleculeViewer3D";
import { usePhysics } from "../../state/physicsStore";

export default function PhysicsEnginePage() {
  const { lastRun } = usePhysics();

  const xyzQ = useQuery({
    queryKey:["xyz"],
    queryFn: async()=> (await fetch("/api/physics/complex.xyz")).text()
  });
  const propsQ = useQuery({
    queryKey:["props"],
    queryFn: ()=> j<{properties:any[]}>(fetch("/api/physics/properties"))
  });

  return (
    <div style={{display:"grid", gridTemplateRows:"1fr 260px", gap:"12px", height:"100%"}}>
      <div className="panel" style={{overflow:"hidden", display:"grid", gridTemplateRows:"36px 1fr"}}>
        <div style={{padding:"6px 10px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center"}}>
          <strong>Structure / Complex Viewer</strong>
        </div>
        <div style={{minHeight:0}}>
          {xyzQ.isLoading ? <div style={{padding:"12px"}}>Loading structure…</div> : (
            <div style={{height:"100%", width:"100%"}}>
              <MoleculeViewer3D xyzText={xyzQ.data || ""} />
            </div>
          )}
        </div>
      </div>

      <div className="panel" style={{overflow:"auto", padding:"10px"}}>
        <h3 style={{marginTop:0}}>Energies / Properties</h3>
        <table className="table">
          <thead><tr><th>Name</th><th>Value</th><th>Units</th><th>Context</th></tr></thead>
          <tbody>
            {(propsQ.data?.properties || []).map((p:any)=>(
              <tr key={p.property_id}>
                <td>{p.name}</td>
                <td>{p.value ?? "—"}</td>
                <td>{p.units ?? "—"}</td>
                <td>{p.context}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {lastRun && <div style={{color:"var(--muted)"}}>Last run: {lastRun.run?.run_id} ({lastRun.run?.status})</div>}
      </div>
    </div>
  );
}
