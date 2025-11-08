import { useLocation } from "react-router-dom";
import PdfControls from "../features/literature/PdfControls";
import DesignerControls from "../features/aidesigner/DesignerControls";
import PhysicsControls from "../features/physics/PhysicsControls";
import Copilot from "./copilot/Copilot";

export default function RightSidebar() {
  const { pathname } = useLocation();

  // treat "/" as literature; handle both "literature" and "literature-review"
  const isLit = pathname === "/" || pathname.startsWith("/literature") || pathname.startsWith("/literature-review");
  const isAI  = pathname.startsWith("/ai-designer");
  const isPE  = pathname.startsWith("/physics") || pathname.startsWith("/physics-engine");

  return (
    <div style={{display:"grid", gridTemplateRows:"auto 1fr", height:"100%"}}>
      <div style={{borderBottom:"1px solid var(--border)", padding:"8px 10px"}}>
        <h4 style={{margin:"6px 0"}}>Controls</h4>
        {isLit && <PdfControls/>}
        {isAI  && <DesignerControls/>}
        {isPE  && <PhysicsControls/>}
      </div>

      <div style={{display:"grid", gridTemplateRows:"36px 1fr 64px"}}>
        <div style={{padding:"8px 10px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center"}}>
          <strong>Copilot</strong>
        </div>
        <Copilot />
      </div>
    </div>
  );
}
