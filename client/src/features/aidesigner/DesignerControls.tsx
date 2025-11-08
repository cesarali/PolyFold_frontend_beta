import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { j } from "../../api/base";
import { useDesigner } from "../../state/designerStore";

type DesignerProperties = {
  Mw: string;
  LogP: string;
  TPSA: string;
  NumRings: string;
  NumRotatableBonds: string;
};

const PROPERTY_FIELDS: { key: keyof DesignerProperties; label: string; placeholder?: string }[] = [
  { key: "Mw", label: "Mw (g/mol)" },
  { key: "LogP", label: "LogP" },
  { key: "TPSA", label: "TPSA (Å²)" },
  { key: "NumRings", label: "Number of Rings" },
  { key: "NumRotatableBonds", label: "Number of Rotatable Bonds" },
];

export default function DesignerControls() {
  const [template, setTemplate] = useState("O");
  const [targetDeltaE, setTargetDeltaE] = useState("-20");
  const [properties, setProperties] = useState<DesignerProperties>({
    Mw: "",
    LogP: "",
    TPSA: "",
    NumRings: "",
    NumRotatableBonds: "",
  });
  const { setResult } = useDesigner();

  const mut = useMutation({
    mutationFn: () => {
      const targets: { kind: string; value: number }[] = [];
      const deltaE = parseFloat(targetDeltaE);
      if (!Number.isNaN(deltaE)) {
        targets.push({ kind: "deltaE_kJmol", value: deltaE });
      }

      const propertyPayloadEntries = Object.entries(properties)
        .map(([key, value]) => [key, value.trim()])
        .filter(([, value]) => value !== "")
        .map(([key, value]) => [key, Number(value)] as const)
        .filter(([, value]) => !Number.isNaN(value));

      const payload: Record<string, unknown> = {
        template,
        targets,
      };

      if (propertyPayloadEntries.length > 0) {
        payload.properties = Object.fromEntries(propertyPayloadEntries);
      }

      return j<any>(
        fetch("/api/ai-designer/propose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      );
    },
    onSuccess: (r) => setResult(r),
  });

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    mut.mutate();
  };

  return (
    <form onSubmit={onSubmit}>
      <label>Template (SMILES)</label>
      <input
        className="input"
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
        style={{ width: "100%" }}
        disabled={mut.isPending}
      />

      <label style={{ marginTop: "8px", display: "block" }}>Target ΔE (kJ/mol)</label>
      <input
        className="input"
        value={targetDeltaE}
        onChange={(e) => setTargetDeltaE(e.target.value)}
        style={{ width: "100%" }}
        disabled={mut.isPending}
      />

      <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
        {PROPERTY_FIELDS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label style={{ display: "block", marginBottom: "4px" }}>{label}</label>
            <input
              className="input"
              value={properties[key]}
              onChange={(e) =>
                setProperties((prev) => ({
                  ...prev,
                  [key]: e.target.value,
                }))
              }
              placeholder={placeholder}
              style={{ width: "100%" }}
              disabled={mut.isPending}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: "12px" }}>
        <button className="btn" type="submit" disabled={mut.isPending}>
          {mut.isPending ? "Proposing…" : "Propose"}
        </button>
      </div>
    </form>
  );
}
