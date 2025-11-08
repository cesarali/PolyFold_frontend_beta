import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { j } from "../../api/base";
import { useDesigner } from "../../state/designerStore";

const PROPERTY_FIELDS = [
  { key: "Mw", label: "Mw (g/mol)", placeholder: "e.g. 340" },
  { key: "LogP", label: "LogP", placeholder: "e.g. 2.5" },
  { key: "TPSA", label: "TPSA (Å²)", placeholder: "e.g. 65" },
  { key: "NumRings", label: "NumRings", placeholder: "e.g. 3" },
  { key: "NumRotatableBonds", label: "NumRotatableBonds", placeholder: "e.g. 4" },
];

export default function DesignerControls() {
  const [template, setTemplate] = useState("O");
  const [target, setTarget] = useState("-20");
  const [properties, setProperties] = useState<Record<string, string>>({
    Mw: "",
    LogP: "",
    TPSA: "",
    NumRings: "",
    NumRotatableBonds: "",
  });
  const { setResult } = useDesigner();

  const buildTargets = () => {
    const targets: { kind: string; value: number }[] = [];
    const deltaE = parseFloat(target);
    if (!Number.isNaN(deltaE)) {
      targets.push({ kind: "deltaE_kJmol", value: deltaE });
    }
    PROPERTY_FIELDS.forEach(({ key }) => {
      const raw = properties[key];
      if (raw === undefined || raw.trim() === "") return;
      const value = parseFloat(raw);
      if (Number.isNaN(value)) return;
      targets.push({ kind: key, value });
    });
    return targets;
  };

  const mut = useMutation<any, Error, { template: string; targets: { kind: string; value: number }[] }>({
    mutationFn: (payload) =>
      j<any>(
        fetch("/api/ai-designer/propose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      ),
    onSuccess: (r, payload) => {
      setResult({ ...r, template: payload.template, submittedTargets: payload.targets });
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = { template, targets: buildTargets() };
    mut.mutate(payload);
  };

  const updateProperty = (key: string, value: string) => {
    setProperties((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Template (SMILES)</label>
      <input
        className="input"
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
        style={{ width: "100%" }}
      />
      <label style={{ marginTop: "8px", display: "block" }}>Target ΔE (kJ/mol)</label>
      <input
        className="input"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        style={{ width: "100%" }}
        type="number"
        step="any"
      />
      <div style={{ marginTop: "12px" }}>
        <strong>Additional properties</strong>
      </div>
      {PROPERTY_FIELDS.map(({ key, label, placeholder }) => (
        <label key={key} style={{ marginTop: "8px", display: "block" }}>
          {label}
          <input
            className="input"
            value={properties[key] ?? ""}
            onChange={(e) => updateProperty(key, e.target.value)}
            style={{ width: "100%", marginTop: "4px" }}
            type="number"
            step="any"
            placeholder={placeholder}
          />
        </label>
      ))}
      <div style={{ marginTop: "12px" }}>
        <button className="btn" type="submit" disabled={mut.isPending}>
          {mut.isPending ? "Proposing…" : "Propose"}
        </button>
      </div>
    </form>
  );
}
