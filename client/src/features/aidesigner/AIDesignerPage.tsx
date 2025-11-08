import ProposalsBody from "./ProposalsBody";
import { useDesigner } from "../../state/designerStore";

const PROPERTY_METADATA: Record<string, { name: string; units: string; context: string }> = {
  deltaE_kJmol: { name: "ΔE", units: "kJ/mol", context: "Target" },
  Mw: { name: "Mw", units: "g/mol", context: "Target" },
  LogP: { name: "LogP", units: "logP", context: "Target" },
  TPSA: { name: "TPSA", units: "Å²", context: "Target" },
  NumRings: { name: "NumRings", units: "count", context: "Target" },
  NumRotatableBonds: { name: "NumRotatableBonds", units: "count", context: "Target" },
};

function SmilesVisualization() {
  const { result } = useDesigner();

  if (!result) {
    return (
      <div style={{ padding: "12px", color: "var(--muted)", textAlign: "center" }}>
        Submit a proposal to visualize the template and candidate SMILES.
      </div>
    );
  }

  const candidates = Array.isArray(result.candidates) ? result.candidates : [];

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      <div>
        <div style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "4px" }}>
          Template SMILES
        </div>
        <code style={{ display: "block", padding: "12px", background: "var(--surface-muted)", borderRadius: "6px" }}>
          {result.template || "—"}
        </code>
      </div>
      <div>
        <div style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "4px" }}>
          Candidate combinations
        </div>
        <div
          style={{
            display: "grid",
            gap: "8px",
            maxHeight: "180px",
            overflow: "auto",
            paddingRight: "4px",
          }}
        >
          {candidates.map((candidate: any, idx: number) => (
            <div
              key={idx}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "8px",
                background: "var(--surface-muted)",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "4px" }}>Candidate #{idx + 1}</div>
              <div style={{ display: "grid", gap: "4px" }}>
                <div>
                  <span style={{ color: "var(--muted)", fontSize: "12px" }}>Monomer</span>
                  <code style={{ display: "block" }}>{candidate.monomer?.smiles || "—"}</code>
                </div>
                <div>
                  <span style={{ color: "var(--muted)", fontSize: "12px" }}>Linker</span>
                  <code style={{ display: "block" }}>{candidate.linker?.smiles || "—"}</code>
                </div>
                <div style={{ color: "var(--muted)", fontSize: "12px" }}>
                  Estimated ΔE ≈ {candidate.estimated_deltaE_kJmol ?? "—"} kJ/mol
                </div>
              </div>
            </div>
          ))}
          {candidates.length === 0 && (
            <div style={{ color: "var(--muted)" }}>No candidates returned yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function EnergiesPropertiesPanel() {
  const { result } = useDesigner();
  const targets = result?.targets ?? [];

  return (
    <div className="panel" style={{ overflow: "auto", padding: "10px" }}>
      <h3 style={{ marginTop: 0 }}>Energies / Properties</h3>
      {targets.length > 0 ? (
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
            {targets.map((target: { kind: string; value: number }, idx: number) => {
              const meta = PROPERTY_METADATA[target.kind] || {
                name: target.kind,
                units: "—",
                context: "Target",
              };
              return (
                <tr key={`${target.kind}-${idx}`}>
                  <td>{meta.name}</td>
                  <td>{target.value}</td>
                  <td>{meta.units}</td>
                  <td>{meta.context}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div style={{ color: "var(--muted)" }}>No property targets submitted yet.</div>
      )}
      {result?.run && (
        <div style={{ color: "var(--muted)", marginTop: "8px" }}>
          Last run: {result.run?.run_id} ({result.run?.status})
        </div>
      )}
    </div>
  );
}

export default function AIDesignerPage() {
  return (
    <div style={{ display: "grid", gridTemplateRows: "minmax(0, 1fr) 260px", gap: "12px", height: "100%" }}>
      <div
        className="panel"
        style={{
          overflow: "hidden",
          display: "grid",
          gridTemplateRows: "40px 1fr",
        }}
      >
        <div
          style={{
            padding: "6px 10px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <strong>SMILES Visualization</strong>
        </div>
        <div
          style={{
            padding: "12px",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 320px",
            gap: "16px",
            minHeight: 0,
          }}
        >
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "12px",
              background: "var(--surface)",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <SmilesVisualization />
          </div>
          <div style={{ minHeight: 0, overflow: "auto", borderLeft: "1px solid var(--border)", paddingLeft: "12px" }}>
            <ProposalsBody />
          </div>
        </div>
      </div>
      <EnergiesPropertiesPanel />
    </div>
  );
}