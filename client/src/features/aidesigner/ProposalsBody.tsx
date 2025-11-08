import { useDesigner } from "../../state/designerStore";
export default function ProposalsBody() {
  const { result } = useDesigner();
  if (!result) return <div style={{padding:"12px", color:"var(--muted)"}}>Use the right panel to request proposals.</div>;
  return (
    <div style={{padding:"6px"}}>
      <h3 style={{marginTop:0}}>Proposed monomer/linker combos</h3>
      <ul>
        {result.candidates.map((c:any, i:number)=>(
          <li key={i}>
            <code>{c.monomer.smiles}</code> + <code>{c.linker.smiles}</code> → est. ΔE ≈ {c.estimated_deltaE_kJmol} kJ/mol
          </li>
        ))}
      </ul>
      <div style={{color:"var(--muted)"}}>run_id: {result.run?.run_id}</div>
    </div>
  );
}
