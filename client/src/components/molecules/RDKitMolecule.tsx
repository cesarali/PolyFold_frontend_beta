import { type CSSProperties, useEffect, useState } from "react";
import initRDKitModule, { type RDKitModule } from "rdkit";

type RDKitMol = {
  get_svg: (options?: Record<string, unknown>) => string;
  delete: () => void;
};

let rdkitPromise: Promise<RDKitModule> | null = null;

function loadRDKit(): Promise<RDKitModule> {
  if (!rdkitPromise) {
    rdkitPromise = initRDKitModule();
  }
  return rdkitPromise;
}

type Props = {
  smiles: string;
};

const containerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  minHeight: "160px",
  alignItems: "center",
};

export default function RDKitMolecule({ smiles }: Props) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!smiles) {
      setSvg(null);
      setError("No SMILES provided");
      return () => {
        cancelled = true;
      };
    }

    setSvg(null);
    setError(null);

    loadRDKit()
      .then((RDKit) => {
        if (cancelled) return;
        let mol: RDKitMol | null = null;
        try {
          mol = RDKit.get_mol(smiles) as RDKitMol | null;
        } catch (err) {
          console.warn("RDKit failed to parse SMILES", err);
        }

        if (!mol) {
          setError("Unable to render molecule");
          return;
        }

        const svgMarkup = mol.get_svg();
        mol.delete();
        if (!cancelled) {
          setSvg(svgMarkup);
        }
      })
      .catch((err) => {
        console.error("Failed to initialise RDKit", err);
        if (!cancelled) {
          setError("RDKit module unavailable");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [smiles]);

  if (error) {
    return (
      <div style={{ ...containerStyle, color: "var(--muted)", fontSize: "0.85rem" }}>
        {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div style={{ ...containerStyle, color: "var(--muted)", fontSize: "0.85rem" }}>
        Rendering molecule…
      </div>
    );
  }

  return <div style={containerStyle} dangerouslySetInnerHTML={{ __html: svg }} />;
}
