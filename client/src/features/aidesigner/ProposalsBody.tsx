import RDKitMolecule from "../../components/molecules/RDKitMolecule";
import { useDesigner } from "../../state/designerStore";

const PROPERTY_KEYS: { key: string; label: string }[] = [
  { key: "Mw", label: "Mw" },
  { key: "LogP", label: "LogP" },
  { key: "TPSA", label: "TPSA" },
  { key: "NumRings", label: "Rings" },
  { key: "NumRotatableBonds", label: "Rotatable" },
];

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  }
  return String(value);
}

export default function ProposalsBody() {
  const { result } = useDesigner();

  if (!result)
    return (
      <div style={{ padding: "12px", color: "var(--muted)" }}>
        Use the right panel to request proposals.
      </div>
    );

  const candidates = Array.isArray(result.candidates) ? result.candidates : [];
  const template = result.template;

  if (!candidates.length) {
    return (
      <div style={{ padding: "12px", display: "grid", gap: "12px" }}>
        <div style={{ color: "var(--muted)" }}>
          No proposals were returned. Adjust the target on the right and try again.
        </div>
        {template ? (
          <div style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
            Last template submitted: <code>{template}</code>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ padding: "12px" }}>
      <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Proposed candidates</h3>
      {candidates.map((candidate: any, i: number) => {
        const smiles = candidate?.monomer?.smiles ?? "";
        const linker = candidate?.linker?.smiles;
        const properties = candidate?.properties ?? {};
        return (
          <div
            key={i}
            className="panel"
            style={{
              padding: "16px",
              marginBottom: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "space-between" }}>
              <div style={{ display: "grid", gap: "4px" }}>
                <code style={{ fontSize: "0.9rem" }}>{smiles || "(no SMILES)"}</code>
                {linker ? (
                  <code style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Linker: {linker}</code>
                ) : null}
              </div>
              <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                ΔE ≈ {candidate?.estimated_deltaE_kJmol ?? "—"} kJ/mol
              </span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "8px", padding: "12px" }}>
              <RDKitMolecule smiles={smiles} />
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {PROPERTY_KEYS.map(({ key, label }) => (
                  <tr key={key}>
                    <td style={{ padding: "4px 0", color: "var(--muted)", fontSize: "0.85rem" }}>{label}</td>
                    <td style={{ padding: "4px 0", textAlign: "right", fontWeight: 600 }}>
                      {formatValue(properties[key])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
      <div style={{ color: "var(--muted)", marginTop: "8px" }}>run_id: {result.run?.run_id}</div>
    </div>
  );
}
