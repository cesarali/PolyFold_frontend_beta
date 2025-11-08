import { useDesigner } from "../../state/designerStore";

export default function ProposalsBody() {
  const { result } = useDesigner();

  if (!result)
    return (
      <div style={{ padding: "12px", color: "var(--muted)" }}>
        Use the right panel to request proposals.
      </div>
    );

  const candidates = result.candidates ?? [];
  const properties = result.properties ?? [];

  return (
    <div style={{ padding: "12px" }}>
      <h3 style={{ marginTop: 0 }}>Proposed monomer/linker combos</h3>
      {candidates.length === 0 ? (
        <div style={{ color: "var(--muted)" }}>No proposals generated.</div>
      ) : (
        <ul>
          {candidates.map((c: any, i: number) => (
            <li key={i} style={{ marginBottom: "8px" }}>
              <div>
                <code>{c.monomer?.smiles}</code> + <code>{c.linker?.smiles}</code>
              </div>
              <div>est. ΔE ≈ {c.estimated_deltaE_kJmol} kJ/mol</div>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: "20px" }}>
        <h3 style={{ marginTop: 0 }}>Energies / Properties</h3>
        {properties.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>No property data reported.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Value</th>
                <th>Units</th>
                <th>Context</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p: any) => (
                <tr key={p.property_id ?? p.name}>
                  <td>{p.name}</td>
                  <td>{p.value ?? "—"}</td>
                  <td>{p.units ?? "—"}</td>
                  <td>{p.context ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ color: "var(--muted)", marginTop: "12px" }}>
        run_id: {result.run?.run_id}
      </div>
    </div>
  );
}
