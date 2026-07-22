import type { TaskDiagram as TaskDiagramSpec } from "@/lib/task-diagram-types";

const STROKE = "var(--color-ink)";
const ACCENT = "var(--color-brand-blue)";

function Label({
  x,
  y,
  children,
  color = ACCENT,
}: {
  x: number | string;
  y: number | string;
  children: string;
  color?: string;
}) {
  return (
    <text x={x} y={y} fontSize="13" fontWeight="700" fill={color} textAnchor="middle">
      {children}
    </text>
  );
}

function shapeContent(d: TaskDiagramSpec) {
  switch (d.kind) {
    case "cube": {
      // Simple isometric cube: front face + offset back face + connectors.
      const front = "60,70 150,70 150,150 60,150";
      const back = "90,40 180,40 180,120 90,120";
      return (
        <>
          <polygon points={front} fill="none" stroke={STROKE} strokeWidth="2" />
          <polygon points={back} fill="none" stroke={STROKE} strokeWidth="2" strokeOpacity="0.55" />
          <line x1="60" y1="70" x2="90" y2="40" stroke={STROKE} strokeWidth="2" strokeOpacity="0.55" />
          <line x1="150" y1="70" x2="180" y2="40" stroke={STROKE} strokeWidth="2" strokeOpacity="0.55" />
          <line x1="150" y1="150" x2="180" y2="120" stroke={STROKE} strokeWidth="2" strokeOpacity="0.55" />
          {d.edgeLabel && (
            <>
              <line x1="60" y1="70" x2="60" y2="150" stroke={ACCENT} strokeWidth="2.5" />
              <Label x="42" y="114">{d.edgeLabel}</Label>
            </>
          )}
        </>
      );
    }
    case "cylinder": {
      return (
        <>
          <ellipse cx="120" cy="55" rx="55" ry="16" fill="none" stroke={STROKE} strokeWidth="2" />
          <line x1="65" y1="55" x2="65" y2="135" stroke={STROKE} strokeWidth="2" />
          <line x1="175" y1="55" x2="175" y2="135" stroke={STROKE} strokeWidth="2" />
          <path d="M 65 135 A 55 16 0 0 0 175 135" fill="none" stroke={STROKE} strokeWidth="2" />
          <path d="M 65 135 A 55 16 0 0 1 175 135" fill="none" stroke={STROKE} strokeWidth="2" strokeDasharray="3 3" strokeOpacity="0.5" />
          {d.diameterLabel && (
            <>
              <line x1="65" y1="55" x2="175" y2="55" stroke={ACCENT} strokeWidth="2" strokeDasharray="4 3" />
              <Label x="120" y="42">{`d = ${d.diameterLabel}`}</Label>
            </>
          )}
          {d.heightLabel && (
            <>
              <line x1="195" y1="55" x2="195" y2="135" stroke={ACCENT} strokeWidth="2" />
              <Label x="215" y="98">{`h = ${d.heightLabel}`}</Label>
            </>
          )}
        </>
      );
    }
    case "triangle-angles": {
      const A = { x: 120, y: 35 };
      const B = { x: 55, y: 150 };
      const C = { x: 195, y: 150 };
      return (
        <>
          <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} fill="none" stroke={STROKE} strokeWidth="2" />
          <Label x={A.x} y={A.y - 10} color={STROKE}>A</Label>
          <Label x={B.x - 16} y={B.y + 4} color={STROKE}>B</Label>
          <Label x={C.x + 16} y={C.y + 4} color={STROKE}>C</Label>
          {d.angleA && <Label x={A.x} y={A.y + 26}>{d.angleA}</Label>}
          {d.angleB && <Label x={B.x + 26} y={B.y - 12}>{d.angleB}</Label>}
          {d.angleC && <Label x={C.x - 26} y={C.y - 12}>{d.angleC}</Label>}
        </>
      );
    }
    case "right-triangle": {
      const A = { x: 60, y: 150 };
      const B = { x: 60, y: 45 };
      const C = { x: 195, y: 150 };
      return (
        <>
          <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} fill="none" stroke={STROKE} strokeWidth="2" />
          <rect x={A.x} y={A.y - 16} width="16" height="16" fill="none" stroke={STROKE} strokeWidth="1.5" />
          {d.legA && <Label x={A.x - 20} y={(A.y + B.y) / 2}>{d.legA}</Label>}
          {d.legB && <Label x={(A.x + C.x) / 2} y={A.y + 22}>{d.legB}</Label>}
        </>
      );
    }
    case "isosceles-triangle": {
      const A = { x: 120, y: 35 };
      const B = { x: 45, y: 150 };
      const C = { x: 195, y: 150 };
      const midAB = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
      const midAC = { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 };
      return (
        <>
          <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} fill="none" stroke={STROKE} strokeWidth="2" />
          {/* tick marks on the two equal sides */}
          <line x1={midAB.x - 4} y1={midAB.y - 6} x2={midAB.x + 4} y2={midAB.y + 6} stroke={STROKE} strokeWidth="2" />
          <line x1={midAC.x - 4} y1={midAC.y - 6} x2={midAC.x + 4} y2={midAC.y + 6} stroke={STROKE} strokeWidth="2" />
          {d.baseAngle && (
            <>
              <Label x={B.x + 24} y={B.y - 10}>{d.baseAngle}</Label>
              <Label x={C.x - 24} y={C.y - 10}>{d.baseAngle}</Label>
            </>
          )}
        </>
      );
    }
    case "triangle-base-height": {
      const A = { x: 90, y: 35 };
      const B = { x: 45, y: 150 };
      const C = { x: 195, y: 150 };
      const footX = A.x;
      return (
        <>
          <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} fill="none" stroke={STROKE} strokeWidth="2" />
          <line x1={A.x} y1={A.y} x2={footX} y2={B.y} stroke={ACCENT} strokeWidth="2" strokeDasharray="4 3" />
          <rect x={footX - 7} y={B.y - 7} width="7" height="7" fill="none" stroke={ACCENT} strokeWidth="1.5" />
          {d.baseLabel && <Label x={(B.x + C.x) / 2} y={B.y + 22}>{d.baseLabel}</Label>}
          {d.heightLabel && <Label x={footX - 20} y={(A.y + B.y) / 2}>{d.heightLabel}</Label>}
        </>
      );
    }
    case "circle": {
      return (
        <>
          <circle cx="120" cy="95" r="60" fill="none" stroke={STROKE} strokeWidth="2" />
          <line x1="120" y1="95" x2="180" y2="95" stroke={ACCENT} strokeWidth="2" />
          <circle cx="120" cy="95" r="2.5" fill={STROKE} />
          <Label x="150" y="87">{d.radiusLabel ? `r = ${d.radiusLabel}` : "r"}</Label>
        </>
      );
    }
    case "rectangle": {
      const x0 = 50, y0 = 55, w = 140, h = 80;
      return (
        <>
          <rect x={x0} y={y0} width={w} height={h} fill="none" stroke={STROKE} strokeWidth="2" />
          {d.widthLabel && <Label x={x0 + w / 2} y={y0 - 12}>{d.widthLabel}</Label>}
          {d.heightLabel && <Label x={x0 - 22} y={y0 + h / 2 + 4}>{d.heightLabel}</Label>}
        </>
      );
    }
    case "rhombus": {
      const cx = 120, cy = 95, hw = 70, hh = 55;
      const top = { x: cx, y: cy - hh };
      const right = { x: cx + hw, y: cy };
      const bottom = { x: cx, y: cy + hh };
      const left = { x: cx - hw, y: cy };
      return (
        <>
          <polygon
            points={`${top.x},${top.y} ${right.x},${right.y} ${bottom.x},${bottom.y} ${left.x},${left.y}`}
            fill="none"
            stroke={STROKE}
            strokeWidth="2"
          />
          <line x1={top.x} y1={top.y} x2={bottom.x} y2={bottom.y} stroke={ACCENT} strokeWidth="1.5" strokeDasharray="4 3" />
          <line x1={left.x} y1={left.y} x2={right.x} y2={right.y} stroke={ACCENT} strokeWidth="1.5" strokeDasharray="4 3" />
          {d.d1Label && <Label x={cx + 16} y={cy - hh / 2}>{d.d1Label}</Label>}
          {d.d2Label && <Label x={cx} y={cy + 16}>{d.d2Label}</Label>}
        </>
      );
    }
    case "square": {
      const x0 = 70, y0 = 45, s = 100;
      return (
        <>
          <rect x={x0} y={y0} width={s} height={s} fill="none" stroke={STROKE} strokeWidth="2" />
          {d.sideLabel && <Label x={x0 + s / 2} y={y0 - 12}>{d.sideLabel}</Label>}
        </>
      );
    }
  }
}

// Rendered above a task's statement whenever it has a `diagram` field —
// deliberately not-to-scale schematic figures (matching how real ФИПИ
// diagrams work), just enough to visualize what the numbers refer to.
export function TaskDiagram({ spec }: { spec: TaskDiagramSpec }) {
  return (
    <div className="mb-4 flex justify-center">
      <svg viewBox="0 0 240 190" className="h-40 w-auto" role="img" aria-label="Схема к заданию">
        {shapeContent(spec)}
      </svg>
    </div>
  );
}
