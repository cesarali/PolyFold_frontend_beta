import { useQuery } from "@tanstack/react-query";
import { j } from "../../api/base";
import ResizableVerticalPanels from "../../components/ResizablePanels";
import { usePhysics } from "../../state/physicsStore";
import MoleculeViewer3D from "./MoleculeViewer3D";

export default function PhysicsEnginePage() {
  const { lastRun } = usePhysics();

  const xyzQ = useQuery({
    queryKey:["xyz"],
    queryFn: async()=> (await fetch("/api/physics/complex.xyz")).text()
  });
  const propsQ = useQuery({
    queryKey:["props"],
    queryFn: ()=> j<{properties:any[]}>(fetch("/api/physics/properties"))
  });

  return (
    <ResizableVerticalPanels
      initialTopRatio={0.7}
      minTopRatio={0.2}
      minBottomRatio={0.2}
      gap={12}
      handleLabel="Resize viewer and properties panels"
      top={
        <div
          className="panel"
          style={{ overflow: "hidden", display: "grid", gridTemplateRows: "36px 1fr", height: "100%", minHeight: 0 }}
        >
          <div
            style={{
              padding: "6px 10px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <strong>Structure / Complex Viewer</strong>
          </div>
          <div style={{ minHeight: 0 }}>
            {xyzQ.isLoading ? (
              <div style={{ padding: "12px" }}>Loading structure…</div>
            ) : (
              <div style={{ height: "100%", width: "100%" }}>
                <MoleculeViewer3D xyzText={xyzQ.data || ""} />
              </div>
            )}
          </div>
        </div>
      }
      bottom={
        <div className="panel" style={{ overflow: "auto", padding: "10px", height: "100%" }}>
          <h3 style={{ marginTop: 0 }}>Energies / Properties</h3>
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
              {(propsQ.data?.properties || []).map((p: any) => (
                <tr key={p.property_id}>
                  <td>{p.name}</td>
                  <td>{p.value ?? "—"}</td>
                  <td>{p.units ?? "—"}</td>
                  <td>{p.context}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {lastRun && (
            <div style={{ color: "var(--muted)" }}>
              Last run: {lastRun.run?.run_id} ({lastRun.run?.status})
            </div>
          )}
        </div>
      }
    />
  );
}
