import { useLocation } from "react-router-dom";
import { useRef, type MouseEvent as ReactMouseEvent } from "react";
import PdfControls from "../features/literature/PdfControls";
import DesignerControls from "../features/aidesigner/DesignerControls";
import PhysicsControls from "../features/physics/PhysicsControls";
import Copilot from "./copilot/Copilot";
import { useUI } from "../state/uiStore";

export default function RightSidebar() {
  const { pathname } = useLocation();
  const {
    copilotCollapsed,
    toggleCopilot,
    controlsPaneHeight,
    setControlsPaneHeight,
  } = useUI();
  const containerRef = useRef<HTMLDivElement>(null);

  const isLit = pathname === "/" || pathname.startsWith("/literature") || pathname.startsWith("/literature-review");
  const isAI  = pathname.startsWith("/ai-designer");
  const isPE  = pathname.startsWith("/physics") || pathname.startsWith("/physics-engine");

  function startControlsResize(event: ReactMouseEvent<HTMLDivElement>) {
    const container = containerRef.current;
    if (!container) return;
    event.preventDefault();

    const rect = container.getBoundingClientRect();
    const startHeight = controlsPaneHeight;
    const pointerOffset = event.clientY - rect.top - startHeight;
    const MIN_CONTROLS = 120;
    const MIN_COPILOT = copilotCollapsed ? 80 : 160;

    function onMouseMove(moveEvent: MouseEvent) {
      const raw = moveEvent.clientY - rect.top - pointerOffset;
      const maxHeight = Math.max(rect.height - MIN_COPILOT, MIN_CONTROLS);
      const next = Math.min(Math.max(raw, MIN_CONTROLS), maxHeight);
      setControlsPaneHeight(next);
    }

    function onMouseUp() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  const handleHeight = 12;
  const minCopilotHeight = copilotCollapsed ? 80 : 160;
  const controlsMaxHeight = `calc(100% - ${minCopilotHeight + handleHeight}px)`;

  return (
    <div
      ref={containerRef}
      style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}
    >
      {/* Controls */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "8px 10px",
          flexBasis: controlsPaneHeight,
          flexGrow: 0,
          flexShrink: 0,
          maxHeight: controlsMaxHeight,
          overflow: "auto",
        }}
      >
        <h4 style={{margin:"6px 0"}}>Controls</h4>
        {isLit && <PdfControls/>}
        {isAI  && <DesignerControls/>}
        {isPE  && <PhysicsControls/>}
      </div>

      {/* Resizer between controls and copilot */}
      <div
        role="separator"
        aria-orientation="horizontal"
        onMouseDown={startControlsResize}
        style={{
          height: `${handleHeight}px`,
          cursor: "row-resize",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <div
          style={{
            width: "60%",
            maxWidth: "120px",
            height: "3px",
            borderRadius: "999px",
            background: "var(--border)",
          }}
        />
      </div>

      <div style={{display:"flex", flexDirection:"column", flex:"1 1 auto", minHeight:0}}>
        {/* Copilot header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 10px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <strong>Copilot</strong>
          <button className="btn" onClick={toggleCopilot}>
            {copilotCollapsed ? "Expand" : "Collapse"}
          </button>
        </div>

        {/* Copilot body ALWAYS mounted; just collapse via height */}
        <div style={{flex:"1 1 auto", minHeight:0, overflow:"hidden"}}>
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
      </div>
    </div>
  );
}
