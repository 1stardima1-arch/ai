// Structured description of a task's geometry figure — deliberately a small,
// closed set of shape kinds (exactly what the seeded geometry tasks need)
// rather than a generic drawing DSL, so every diagram is hand-verified
// correct rather than computed from arbitrary inputs. Rendered by
// <TaskDiagram> (src/components/app/task-diagram.tsx) as inline SVG, themed
// via CSS vars so it works in light/dark automatically. Type-only file (no
// runtime code) so prisma/seed-data.ts can import it without pulling in
// anything React-related.
export type TaskDiagram =
  | { kind: "cube"; edgeLabel?: string }
  | { kind: "cylinder"; diameterLabel?: string; heightLabel?: string }
  | { kind: "triangle-angles"; angleA?: string; angleB?: string; angleC?: string }
  | { kind: "right-triangle"; legA?: string; legB?: string }
  | { kind: "isosceles-triangle"; baseAngle?: string }
  | { kind: "triangle-base-height"; baseLabel?: string; heightLabel?: string }
  | { kind: "circle"; radiusLabel?: string }
  | { kind: "rectangle"; widthLabel?: string; heightLabel?: string }
  | { kind: "rhombus"; d1Label?: string; d2Label?: string }
  | { kind: "square"; sideLabel?: string }
  | { kind: "series-circuit"; voltageLabel?: string; resistanceLabel?: string; currentLabel?: string }
  | { kind: "ray-refraction"; angle1Label?: string; angle2Label?: string }
  | {
      kind: "graph";
      nodes: string[];
      edges: { from: string; to: string; weight?: string }[];
    };
