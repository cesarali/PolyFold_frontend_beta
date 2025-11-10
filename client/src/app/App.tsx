import { Outlet, NavLink } from "react-router-dom";
import { useMemo, type MouseEvent as ReactMouseEvent } from "react";
import TopBar from "../components/TopBar";
import RightSidebar from "../components/RightSidebar";
import { useUI } from "../state/uiStore";

export default function App() {
  const {
    leftOpen,
    rightOpen,
    toggleLeft,
    rightSidebarWidth,
    setRightSidebarWidth,
  } = useUI();

  const columns = useMemo(() => {
    const leftWidth = leftOpen ? "220px" : "56px";
    const rightWidth = rightOpen ? `${rightSidebarWidth}px` : "0px";
    return `${leftWidth} 1fr ${rightWidth}`;
  }, [leftOpen, rightOpen, rightSidebarWidth]);

  function startRightResize(event: ReactMouseEvent<HTMLDivElement>) {
    if (!rightOpen) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = rightSidebarWidth;
    const MIN_WIDTH = 240;
    const MAX_WIDTH = 640;

    function onMouseMove(moveEvent: MouseEvent) {
      const delta = startX - moveEvent.clientX;
      const next = Math.min(Math.max(startWidth + delta, MIN_WIDTH), MAX_WIDTH);
      setRightSidebarWidth(next);
    }

    function onMouseUp() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  return (
    <div style={{display:"grid", gridTemplateRows:"52px 1fr", height:"100vh"}}>
      <TopBar />
      <div style={{display:"grid", gridTemplateColumns: columns, gap:"12px", padding:"12px", overflow:"hidden"}}>
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

        <aside className="panel" style={{overflow:"hidden", position:"relative", display:rightOpen ? "block" : "none"}}>
          {rightOpen && (
            <div
              role="separator"
              aria-orientation="vertical"
              onMouseDown={startRightResize}
              style={{
                position: "absolute",
                top: 0,
                left: "-12px",
                width: "12px",
                height: "100%",
                cursor: "col-resize",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingRight: "4px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: "4px",
                  height: "40%",
                  minHeight: "40px",
                  borderRadius: "999px",
                  background: "var(--border)",
                }}
              />
            </div>
          )}
          <RightSidebar />
        </aside>
      </div>
    </div>
  );
}
