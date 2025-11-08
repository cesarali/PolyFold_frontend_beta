declare module "rdkit" {
  export type RDKitMolecule = {
    get_svg: (options?: Record<string, unknown>) => string;
    delete: () => void;
  } | null;

  export type RDKitModule = {
    get_mol: (smiles: string) => RDKitMolecule;
  };

  export default function initRDKitModule(
    options?: Record<string, unknown>
  ): Promise<RDKitModule>;
}
