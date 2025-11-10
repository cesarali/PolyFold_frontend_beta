import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import ResizableVerticalPanels from "./ResizablePanels";
import PdfControls from "../features/literature/PdfControls";
import DesignerControls from "../features/aidesigner/DesignerControls";
import PhysicsControls from "../features/physics/PhysicsControls";
import Copilot from "./copilot/Copilot";
import { useUI } from "../state/uiStore";

const PANEL_PADDING = "10px";

export default function RightSidebar() {
  const { pathname } = useLocation();
  const { copilotCollapsed, toggleCopilot } = useUI();

  const { controlsContent, copilotContent } = useMemo(() => {
    const isLit =
      pathname === "/" ||
      pathname.startsWith("/literature") ||
      pathname.startsWith("/literature-review");
    const isAI = pathname.startsWith("/ai-designer");
    const isPE = pathname.startsWith("/physics") || pathname.startsWith("/physics-engine");

    const controls = (
      <div
        style={{
          display: "grid",
          gridTemplateRows: "auto 1fr",
          minHeight: 0,
          height: "100%",
        }}
      >
        <div
          style={{
            padding: "8px 10px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h4 style={{ margin: "6px 0" }}>Controls</h4>
        </div>
        <div
          style={{
            padding: PANEL_PADDING,
            overflowY: "auto",
            minHeight: 0,
          }}
        >
          {isLit && <PdfControls />}
          {isAI && <DesignerControls />}
          {isPE && <PhysicsControls />}
        </div>
      </div>
    );

    const copilotSection = (
      <div
        style={{
          display: "grid",
          gridTemplateRows: copilotCollapsed ? "auto" : "auto 1fr",
          minHeight: 0,
          height: copilotCollapsed ? "auto" : "100%",
        }}
      >
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
        {!copilotCollapsed && (
          <div
            style={{
              minHeight: 0,
              height: "100%",
            }}
          >
            <Copilot collapsed={copilotCollapsed} />
          </div>
        )}
      </div>
    );

    return { controlsContent: controls, copilotContent: copilotSection };
  }, [copilotCollapsed, pathname, toggleCopilot]);

  return (
    <ResizableVerticalPanels
      initialTopRatio={0.45}
      minTopRatio={0.2}
      minBottomRatio={0.25}
      gap={12}
      handleLabel="Resize controls and Copilot panels"
      top={controlsContent}
      bottom={copilotContent}
      bottomCollapsed={copilotCollapsed}
    />
  );
}
