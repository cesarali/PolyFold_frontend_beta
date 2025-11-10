import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import TopBar from "../components/TopBar";
import RightSidebar from "../components/RightSidebar";
import { useUI } from "../state/uiStore";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const MIN_RIGHT_WIDTH = 260;
const MAX_RIGHT_WIDTH = 640;
const HANDLE_STEP = 24;
const HANDLE_WIDTH = 12;

export default function App() {
  const { leftOpen, rightOpen, toggleLeft } = useUI();
  const [rightWidth, setRightWidth] = useState(360);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(rightWidth);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      setRightWidth((current) => {
        const delta = event.key === "ArrowRight" ? -HANDLE_STEP : HANDLE_STEP;
        return clamp(current + delta, MIN_RIGHT_WIDTH, MAX_RIGHT_WIDTH);
      });
    }
  };

  const updateWidth = useCallback((clientX: number) => {
    const delta = clientX - startXRef.current;
    const nextWidth = clamp(
      startWidthRef.current - delta,
      MIN_RIGHT_WIDTH,
      MAX_RIGHT_WIDTH,
    );
    setRightWidth(nextWidth);
  }, []);

  useEffect(() => {
    if (!isResizingRight) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault();
      updateWidth(event.clientX);
    };

    const handlePointerUp = () => {
      setIsResizingRight(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isResizingRight, updateWidth]);

  useEffect(() => {
    if (!isResizingRight) {
      return;
    }

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [isResizingRight]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!rightOpen) {
      return;
    }

    event.preventDefault();
    startXRef.current = event.clientX;
    startWidthRef.current = rightWidth;
    setIsResizingRight(true);
    updateWidth(event.clientX);
  };

  const leftColumnWidth = leftOpen ? 220 : 56;

  const containerColumns = useMemo(
    () => `${leftColumnWidth}px 1fr`,
    [leftColumnWidth],
  );

  return (
    <div
      style={{ display: "grid", gridTemplateRows: "52px 1fr", height: "100vh" }}
    >
      <TopBar />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: containerColumns,
          gap: "12px",
          padding: "12px",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        <aside className="panel" style={{ overflow: "auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 10px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div style={{ color: "var(--muted)", fontWeight: 600 }}>Roles</div>
            <button className="btn" onClick={toggleLeft} aria-label="Toggle left">
              {leftOpen ? "⟨" : "⟩"}
            </button>
          </div>
          {leftOpen && (
            <div style={{ padding: "8px" }}>
              <nav style={{ display: "grid", gap: "6px" }}>
                <NavLink
                  to="/literature-review"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Literature review
                </NavLink>
                <NavLink
                  to="/ai-designer"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  AI Designer
                </NavLink>
                <NavLink
                  to="/physics-engine"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Physics Engine
                </NavLink>
              </nav>
            </div>
          )}
        </aside>

        <div style={{ display: "flex", minHeight: 0 }}>
          <main
            className="panel"
            style={{
              overflow: "hidden",
              display: "grid",
              minHeight: "0",
              flex: "1 1 auto",
            }}
          >
            <Outlet />
          </main>

          {rightOpen && (
            <>
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize right sidebar"
                aria-valuenow={Math.round(
                  ((rightWidth - MIN_RIGHT_WIDTH) /
                    (MAX_RIGHT_WIDTH - MIN_RIGHT_WIDTH)) *
                    100,
                )}
                aria-valuemin={0}
                aria-valuemax={100}
                tabIndex={0}
                className={`resizable-sidebar__handle${
                  isResizingRight ? " dragging" : ""
                }`}
                onPointerDown={handlePointerDown}
                onKeyDown={handleKeyDown}
                style={{ width: `${HANDLE_WIDTH}px` }}
              />
              <aside
                className="panel"
                style={{
                  overflow: "hidden",
                  width: `${rightWidth}px`,
                  flex: "0 0 auto",
                  minHeight: 0,
                }}
              >
                <RightSidebar />
              </aside>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
