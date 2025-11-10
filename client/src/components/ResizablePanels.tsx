import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ResizableVerticalPanelsProps {
  top: ReactNode;
  bottom: ReactNode;
  /** Fraction of the available height the top panel should take initially. */
  initialTopRatio?: number;
  /** Minimum fraction of the height that must remain for the top panel. */
  minTopRatio?: number;
  /** Minimum fraction of the height that must remain for the bottom panel. */
  minBottomRatio?: number;
  /** Space between the panels, in pixels. */
  gap?: number;
  className?: string;
  style?: CSSProperties;
  /** Accessible label for the resize handle. */
  handleLabel?: string;
  /** When true, the bottom panel collapses to its natural height. */
  bottomCollapsed?: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function ResizableVerticalPanels({
  top,
  bottom,
  initialTopRatio = 0.65,
  minTopRatio = 0.2,
  minBottomRatio = 0.2,
  gap = 12,
  className,
  style,
  handleLabel = "Resize panels",
  bottomCollapsed = false,
}: ResizableVerticalPanelsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const minTop = clamp(minTopRatio, 0, 0.9);
  const minBottom = clamp(minBottomRatio, 0, 0.9);
  const initialRatio = clamp(initialTopRatio, minTop, 1 - minBottom);
  const [topRatio, setTopRatio] = useState(initialRatio);
  const [isDragging, setIsDragging] = useState(false);

  const updateRatio = useCallback(
    (clientY: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.height <= 0) return;
      const offset = clientY - rect.top;
      const ratio = offset / rect.height;
      setTopRatio((current) => {
        const next = clamp(ratio, minTop, 1 - minBottom);
        return Number.isFinite(next) ? next : current;
      });
    },
    [minBottom, minTop],
  );

  const stopDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault();
      updateRatio(event.clientY);
    };

    const handlePointerUp = () => {
      stopDragging();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, stopDragging, updateRatio]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [isDragging]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
    updateRatio(event.clientY);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const increment = 0.02;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      setTopRatio((current) => {
        const delta = event.key === "ArrowUp" ? increment : -increment;
        return clamp(current + delta, minTop, 1 - minBottom);
      });
    }
  };

  const containerClassName = useMemo(() => {
    return ["resizable-vertical-panels", className].filter(Boolean).join(" ");
  }, [className]);

  const effectiveGap = Math.max(0, gap);
  const handleThickness = 6;
  const handleMargin = Math.max(0, (effectiveGap - handleThickness) / 2);

  const baseStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    height: "100%",
    ...style,
  };

  const topFlexStyle: CSSProperties = bottomCollapsed
    ? { flex: "1 1 auto", minHeight: 0 }
    : { flex: `${topRatio} 1 0`, minHeight: 0 };

  const bottomFlexStyle: CSSProperties = bottomCollapsed
    ? { flex: "0 0 auto", minHeight: "auto" }
    : { flex: `${1 - topRatio} 1 0`, minHeight: 0 };

  return (
    <div ref={containerRef} className={containerClassName} style={baseStyle}>
      <div className="resizable-vertical-panels__top" style={topFlexStyle}>
        {top}
      </div>
      {!bottomCollapsed && (
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label={handleLabel}
          aria-valuenow={Math.round(topRatio * 100)}
          aria-valuemin={Math.round(minTop * 100)}
          aria-valuemax={Math.round((1 - minBottom) * 100)}
          tabIndex={0}
          className={`resizable-vertical-panels__handle${isDragging ? " dragging" : ""}`}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
          style={{ height: handleThickness, margin: `${handleMargin}px 0` }}
        />
      )}
      <div className="resizable-vertical-panels__bottom" style={bottomFlexStyle}>
        {bottom}
      </div>
    </div>
  );
}
