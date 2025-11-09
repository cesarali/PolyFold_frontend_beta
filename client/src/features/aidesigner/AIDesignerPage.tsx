import type { KeyboardEvent } from "react";
import { useDesigner } from "../../state/designerStore";

const PROPERTY_METADATA: Record<string, { name: string; units: string; context: string }> = {
  deltaE_kJmol: { name: "ΔE", units: "kJ/mol", context: "Target" },
  MW: { name: "Mw", units: "g/mol", context: "Computed" },
  LogP: { name: "LogP", units: "logP", context: "Computed" },
  TPSA: { name: "TPSA", units: "Å²", context: "Computed" },
  NumRings: { name: "NumRings", units: "count", context: "Computed" },
  NumRotatableBonds: { name: "NumRotatableBonds", units: "count", context: "Computed" },
};

const PROPERTY_ORDER = ["MW", "LogP", "TPSA", "NumRings", "NumRotatableBonds"];

function SmilesVisualization() {
  const { result, selectedCandidateIndex, setSelectedCandidateIndex } = useDesigner();

  if (!result) {
    return (
      <div style={{ padding: "12px", color: "var(--muted)", textAlign: "center" }}>
        Submit a proposal to visualize the template and candidate SMILES.
      </div>
    );
  }

  const candidates = Array.isArray(result.candidates) ? result.candidates : [];

  return (
    <div
      style={{
        display: "grid",
        gap: "12px",
        gridTemplateRows: "auto 1fr",
        height: "100%",
        minHeight: 0,
        flex: "1 1 auto",
        overflow: "hidden",
      }}
    >
      <div>
        <div style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "4px" }}>
          Template SMILES
        </div>
        <code
          style={{
            display: "block",
            padding: "12px",
            background: "var(--surface-muted)",
            borderRadius: "6px",
            maxWidth: "100%",
            overflow: "auto",
            whiteSpace: "pre",
          }}
        >
          {result.template || "—"}
        </code>
      </div>
      <div style={{ display: "grid", gridTemplateRows: "auto 1fr", minHeight: 0, overflow: "hidden" }}>
        <div style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "4px" }}>
          Candidate combinations
        </div>
        <div
          style={{
            display: "grid",
            gap: "8px",
            minHeight: 0,
            overflow: "auto",
            paddingRight: "4px",
          }}
        >
          {candidates.map((candidate: any, idx: number) => {
            const isSelected = idx === selectedCandidateIndex;
            const borderColor = isSelected ? "var(--primary)" : "var(--border)";
            const background = isSelected ? "var(--surface)" : "var(--surface-muted)";

            const handleSelect = () => {
              setSelectedCandidateIndex(idx);
            };

            const handleKeyDown = (evt: KeyboardEvent<HTMLDivElement>) => {
              if (evt.key === "Enter" || evt.key === " ") {
                evt.preventDefault();
                handleSelect();
              }
            };

            return (
              <div
                key={idx}
                role="button"
                tabIndex={0}
                onClick={handleSelect}
                onKeyDown={handleKeyDown}
                aria-pressed={isSelected}
                style={{
                  border: `2px solid ${borderColor}`,
                  borderRadius: "8px",
                  padding: "8px",
                  background,
                  cursor: "pointer",
                  outline: "none",
                  transition: "border-color 0.15s ease, background 0.15s ease",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: "4px" }}>Candidate #{idx + 1}</div>
                <div style={{ display: "grid", gap: "4px" }}>
                  <div>
                    <span style={{ color: "var(--muted)", fontSize: "12px" }}>Monomer</span>
                    <code
                      style={{
                        display: "block",
                        maxWidth: "100%",
                        overflow: "auto",
                        whiteSpace: "pre",
                      }}
                    >
                      {candidate.monomer?.smiles || "—"}
                    </code>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", fontSize: "12px" }}>Linker</span>
                    <code
                      style={{
                        display: "block",
                        maxWidth: "100%",
                        overflow: "auto",
                        whiteSpace: "pre",
                      }}
                    >
                      {candidate.linker?.smiles || "—"}
                    </code>
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: "12px" }}>
                    Estimated ΔE ≈ {candidate.estimated_deltaE_kJmol ?? "—"} kJ/mol
                  </div>
                </div>
              </div>
            );
          })}
          {candidates.length === 0 && (
            <div style={{ color: "var(--muted)" }}>No candidates returned yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function CandidatePropertiesPanel() {
  const { result, selectedCandidateIndex } = useDesigner();
  const summaries = Array.isArray(result?.property_summary) ? result?.property_summary : [];
  const candidates = Array.isArray(result?.candidates) ? result?.candidates : [];

  const selectedCandidate =
    typeof selectedCandidateIndex === "number" &&
    selectedCandidateIndex >= 0 &&
    selectedCandidateIndex < candidates.length
      ? candidates[selectedCandidateIndex]
      : null;

  const properties =
    selectedCandidate &&
    selectedCandidate.properties &&
    typeof selectedCandidate.properties === "object"
      ? (selectedCandidate.properties as Record<string, unknown>)
      : null;

  const selectedCandidateLabel =
    typeof selectedCandidateIndex === "number"
      ? selectedCandidateIndex + 1
      : selectedCandidate
      ? Math.max(1, candidates.indexOf(selectedCandidate) + 1)
      : null;

  const formatNumber = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
    }
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    return String(value);
  };

  return (
    <div className="panel" style={{ overflow: "auto", padding: "10px" }}>
      <h3 style={{ marginTop: 0 }}>Candidate Properties</h3>
      {selectedCandidate ? (
        <div style={{ display: "grid", gap: "8px" }}>
          <div style={{ fontWeight: 600 }}>
            Candidate #{selectedCandidateLabel ?? "—"}
          </div>
          <div>
            <span style={{ color: "var(--muted)", fontSize: "12px" }}>SMILES</span>
            <code
              style={{
                display: "block",
                padding: "8px",
                background: "var(--surface-muted)",
                borderRadius: "6px",
                overflow: "auto",
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedCandidate.smiles || "—"}
            </code>
          </div>
          {properties ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Value</th>
                  <th>Units</th>
                  <th>Context</th>
                </tr>
              </thead>
              <tbody>
                {PROPERTY_ORDER.flatMap((key) => {
                  const value = properties[key];
                  if (value === undefined || value === null || value === "") {
                    return [];
                  }
                  const meta = PROPERTY_METADATA[key] || {
                    name: key,
                    units: "—",
                    context: "Computed",
                  };
                  return [
                    <tr key={key}>
                      <td>{meta.name}</td>
                      <td>{formatNumber(value)}</td>
                      <td>{meta.units}</td>
                      <td>{meta.context}</td>
                    </tr>,
                  ];
                })}
                {Object.entries(properties)
                  .filter(([key]) => !PROPERTY_ORDER.includes(key))
                  .map(([key, value]) => (
                    <tr key={key}>
                      <td>{PROPERTY_METADATA[key]?.name ?? key}</td>
                      <td>{formatNumber(value)}</td>
                      <td>{PROPERTY_METADATA[key]?.units ?? "—"}</td>
                      <td>{PROPERTY_METADATA[key]?.context ?? "Computed"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <div style={{ color: "var(--muted)" }}>
              No computed properties available for this candidate.
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: "var(--muted)" }}>
          Select a candidate from the list to view its computed properties.
        </div>
      )}
      <h4 style={{ marginTop: "16px", marginBottom: "4px" }}>Aggregate Summary</h4>
      {summaries.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Sum</th>
              <th>Doubled</th>
              <th>Units</th>
              <th>Context</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((summary: { kind: string; sum: number; doubled: number }, idx: number) => {
              const meta = PROPERTY_METADATA[summary.kind] || {
                name: summary.kind,
                units: "—",
                context: "Target",
              };
              return (
                <tr key={`${summary.kind}-${idx}`}>
                  <td>{meta.name}</td>
                  <td>{formatNumber(summary.sum)}</td>
                  <td>{formatNumber(summary.doubled)}</td>
                  <td>{meta.units}</td>
                  <td>{meta.context}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div style={{ color: "var(--muted)" }}>No property summaries available yet.</div>
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
    <div
      style={{
        display: "grid",
        gridTemplateRows: "minmax(0, 1fr) 260px",
        gap: "12px",
        height: "100%",
        minHeight: 0,
      }}
    >
      <div
        className="panel"
        style={{
          overflow: "hidden",
          display: "grid",
          gridTemplateRows: "40px 1fr",
          minHeight: 0,
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
            gridTemplateColumns: "minmax(0, 1fr)",
            minHeight: 0,
            height: "100%",
          }}
        >
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "12px",
              background: "var(--surface)",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
            }}
          >
            <SmilesVisualization />
          </div>
        </div>
      </div>
      <CandidatePropertiesPanel />
    </div>
  );
}
