import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { j } from "../../api/base";
import { useDesigner } from "../../state/designerStore";

export default function DesignerControls() {
  const [template, setTemplate] = useState("O");
  const [target, setTarget] = useState("-20");
  const { setResult } = useDesigner();

  const mut = useMutation({
    mutationFn: async () =>
      j<any>(
        fetch("/api/ai-designer/propose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            template,
            targets: [{ kind: "deltaE_kJmol", value: parseFloat(target) }],
          }),
        })
      ),
    onSuccess: (response) => {
      setResult(response);
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mut.reset();
    mut.mutate();
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: "8px" }}>
      <label htmlFor="ai-template">Template (SMILES)</label>
      <input
        id="ai-template"
        className="input"
        value={template}
        onChange={(event) => setTemplate(event.target.value)}
        style={{ width: "100%" }}
        placeholder="C=CC(=O)O"
        autoComplete="off"
      />

      <label htmlFor="ai-target" style={{ marginTop: "4px" }}>
        Target ΔE (kJ/mol)
      </label>
      <input
        id="ai-target"
        className="input"
        value={target}
        onChange={(event) => setTarget(event.target.value)}
        style={{ width: "100%" }}
        autoComplete="off"
      />

      <button className="btn" type="submit" disabled={mut.isPending}>
        {mut.isPending ? "Proposing…" : "Propose"}
      </button>

      {mut.isError ? (
        <div style={{ color: "#ff9d9d", fontSize: "0.85rem" }}>
          {mut.error instanceof Error ? mut.error.message : "Failed to fetch proposal."}
        </div>
      ) : null}
    </form>
  );
}
