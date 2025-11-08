import { useQuery } from "@tanstack/react-query";
import { useSession } from "../../state/sessionStore";
import { j } from "../../api/base";

export default function SchemaInspector() {
  const { currentSourceId } = useSession();
  const q = useQuery({
    queryKey:["canon", currentSourceId],
    queryFn: () => j<any[]>(fetch(`/api/literature/pdfs/${currentSourceId}/canonical-properties`)),
    enabled: !!currentSourceId,
  });
  if (!currentSourceId) return null;
  return (
    <div>
      <h3 style={{marginTop:0}}>Canonical properties</h3>
      {q.isLoading ? <div>Loading canonical properties…</div> : (
        <table className="table">
          <thead><tr><th>Name</th><th>Value</th><th>Err</th><th>Units</th><th>Category</th><th>Role</th><th>Conf</th></tr></thead>
          <tbody>
            {(q.data||[]).map((p:any) => (
              <tr key={p.property_id}>
                <td>{p.name}</td><td>{p.value ?? "—"}</td><td>{p.error ?? "—"}</td><td>{p.units ?? "—"}</td><td>{p.category}</td><td>{p.qualifiers?.role ?? "—"}</td><td>{Math.round((p.confidence ?? 0)*100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
