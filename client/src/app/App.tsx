import { Outlet, NavLink } from "react-router-dom";
import TopBar from "../components/TopBar";
import RightSidebar from "../components/RightSidebar";
import { useUI } from "../state/uiStore";

export default function App() {
  const { leftOpen, rightOpen, toggleLeft } = useUI();
  return (
    <div style={{display:"grid", gridTemplateRows:"52px 1fr", height:"100vh"}}>
      <TopBar />
      <div style={{display:"grid", gridTemplateColumns:`${leftOpen ? "220px" : "56px"} 1fr ${rightOpen ? "360px" : "0px"}`, gap:"12px", padding:"12px", overflow:"hidden"}}>
        <aside className="panel" style={{overflow:"auto"}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", borderBottom:"1px solid var(--border)"}}>
            <div style={{color:"var(--muted)", fontWeight:600}}>Roles</div>
            <button className="btn" onClick={toggleLeft} aria-label="Toggle left">{leftOpen ? "⟨" : "⟩"}</button>
          </div>
          {leftOpen && (
            <div style={{padding:"8px"}}>
              <nav style={{display:"grid", gap:"6px"}}>
                <NavLink to="/literature-review" className={({isActive})=> isActive ? "active" : ""}>Literature review</NavLink>
                <NavLink to="/ai-designer" className={({isActive})=> isActive ? "active" : ""}>AI Designer</NavLink>
                <NavLink to="/physics-engine" className={({isActive})=> isActive ? "active" : ""}>Physics Engine</NavLink>
              </nav>
            </div>
          )}
        </aside>

        <main className="panel" style={{overflow:"hidden", display:"grid", minHeight:"0"}}>
          <Outlet />
        </main>

        <aside className="panel" style={{overflow:"hidden"}}>
          <RightSidebar />
        </aside>
      </div>
    </div>
  );
}
