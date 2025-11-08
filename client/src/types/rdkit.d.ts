declare module "rdkit" {
  export type RDKitMolecule = {
    get_svg: (options?: Record<string, unknown>) => string;
    delete: () => void;
  } | null;

  export type RDKitModule = {
    get_mol: (smiles: string) => RDKitMolecule;
  };

  export type RDKitInitOptions = Record<string, unknown> & {
    locateFile?: (file: string) => string;
  };

  export default function initRDKitModule(
    options?: RDKitInitOptions
  ): Promise<RDKitModule>;
}

