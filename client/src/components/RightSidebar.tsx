import { useLocation } from "react-router-dom";
import PdfControls from "../features/literature/PdfControls";
import DesignerControls from "../features/aidesigner/DesignerControls";
import PhysicsControls from "../features/physics/PhysicsControls";
import Copilot from "./copilot/Copilot";
import { useUI } from "../state/uiStore";

export default function RightSidebar() {
  const { pathname } = useLocation();
  const { copilotCollapsed, toggleCopilot } = useUI();

  const isLit = pathname === "/" || pathname.startsWith("/literature") || pathname.startsWith("/literature-review");
  const isAI  = pathname.startsWith("/ai-designer");
  const isPE  = pathname.startsWith("/physics") || pathname.startsWith("/physics-engine");

  return (
    <div style={{display:"grid", gridTemplateRows:"auto auto 1fr", height:"100%"}}>
      {/* Controls */}
      <div style={{borderBottom:"1px solid var(--border)", padding:"8px 10px"}}>
        <h4 style={{margin:"6px 0"}}>Controls</h4>
        {isLit && <PdfControls/>}
        {isAI  && <DesignerControls/>}
        {isPE  && <PhysicsControls/>}
      </div>

      {/* Copilot header */}
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px",
                   borderBottom:"1px solid var(--border)"}}>
        <strong>Copilot</strong>
        <button className="btn" onClick={toggleCopilot}>
          {copilotCollapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {/* Copilot body ALWAYS mounted; just collapse via height */}
      <div
        style={{
          height: copilotCollapsed ? 0 : "100%",
          minHeight: 0,
          overflow: copilotCollapsed ? "hidden" : "visible",
          transition: "height 160ms ease",
        }}
      >
        <Copilot collapsed={copilotCollapsed} />
      </div>
    </div>
  );
}
