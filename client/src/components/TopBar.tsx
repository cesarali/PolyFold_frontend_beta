import { useUI } from "../state/uiStore";
export default function TopBar() {
  const { toggleRight } = useUI();
  return (
    <header style={{display:"flex", alignItems:"center", padding:"8px 12px", background:"var(--bg-elev)", borderBottom:"1px solid var(--border)"}}>
      <div style={{fontWeight:800, letterSpacing:0.5}}>PolyFold_RX</div>
      <div style={{marginLeft:"auto", display:"flex", alignItems:"center", gap:"12px"}}>
        <a href="/account">Account ▾</a>
        <button className="btn" onClick={toggleRight}>Right panel</button>
      </div>
    </header>
  );
}
