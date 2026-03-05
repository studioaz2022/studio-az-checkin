'use client';

import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
}

interface Trace {
  nodes: Node[];
}

interface Pulse {
  traceIdx: number;
  progress: number;
  speed: number;
  size: number;
  opacity: number;
  direction: 1 | -1;
}

// Logo exclusion zone (normalized) — tightened slightly
const LOGO_ZONE = { x1: 0.25, y1: 0.20, x2: 0.75, y2: 0.42 };

// Dense circuit board traces — many more lines for a rich PCB look
const TRACES: Trace[] = [
  // === MAIN HIGHWAYS ===

  // Horizontal — top, routes around logo
  { nodes: [
    { x: 0.02, y: 0.10 }, { x: 0.18, y: 0.10 }, { x: 0.18, y: 0.46 },
    { x: 0.82, y: 0.46 }, { x: 0.82, y: 0.10 }, { x: 0.98, y: 0.10 },
  ]},
  // Horizontal — upper mid
  { nodes: [
    { x: 0.0, y: 0.52 }, { x: 0.25, y: 0.52 }, { x: 0.40, y: 0.52 },
    { x: 0.60, y: 0.52 }, { x: 0.75, y: 0.52 }, { x: 1.0, y: 0.52 },
  ]},
  // Horizontal — mid
  { nodes: [
    { x: 0.0, y: 0.58 }, { x: 0.15, y: 0.58 }, { x: 0.30, y: 0.58 },
    { x: 0.70, y: 0.58 }, { x: 0.85, y: 0.58 }, { x: 1.0, y: 0.58 },
  ]},
  // Horizontal — lower
  { nodes: [
    { x: 0.02, y: 0.72 }, { x: 0.35, y: 0.72 }, { x: 0.35, y: 0.68 },
    { x: 0.65, y: 0.68 }, { x: 0.65, y: 0.72 }, { x: 0.98, y: 0.72 },
  ]},
  // Horizontal — bottom
  { nodes: [
    { x: 0.0, y: 0.82 }, { x: 0.20, y: 0.82 }, { x: 0.42, y: 0.82 },
    { x: 0.58, y: 0.82 }, { x: 0.80, y: 0.82 }, { x: 1.0, y: 0.82 },
  ]},

  // Vertical — far left
  { nodes: [
    { x: 0.08, y: 0.02 }, { x: 0.08, y: 0.35 }, { x: 0.08, y: 0.65 },
    { x: 0.08, y: 0.98 },
  ]},
  // Vertical — left of logo
  { nodes: [
    { x: 0.18, y: 0.02 }, { x: 0.18, y: 0.46 }, { x: 0.18, y: 0.60 },
    { x: 0.18, y: 0.98 },
  ]},
  // Vertical — right of logo
  { nodes: [
    { x: 0.82, y: 0.02 }, { x: 0.82, y: 0.46 }, { x: 0.82, y: 0.60 },
    { x: 0.82, y: 0.98 },
  ]},
  // Vertical — far right
  { nodes: [
    { x: 0.92, y: 0.02 }, { x: 0.92, y: 0.35 }, { x: 0.92, y: 0.65 },
    { x: 0.92, y: 0.98 },
  ]},
  // Vertical — center, below logo
  { nodes: [
    { x: 0.50, y: 0.48 }, { x: 0.50, y: 0.62 }, { x: 0.50, y: 0.78 },
    { x: 0.50, y: 0.98 },
  ]},
  // Vertical — left-center, below logo
  { nodes: [
    { x: 0.35, y: 0.48 }, { x: 0.35, y: 0.60 }, { x: 0.35, y: 0.78 },
    { x: 0.35, y: 0.95 },
  ]},
  // Vertical — right-center, below logo
  { nodes: [
    { x: 0.65, y: 0.48 }, { x: 0.65, y: 0.60 }, { x: 0.65, y: 0.78 },
    { x: 0.65, y: 0.95 },
  ]},

  // === ANGLED CONNECTORS ===

  // Top-left → below logo
  { nodes: [
    { x: 0.08, y: 0.15 }, { x: 0.18, y: 0.15 }, { x: 0.18, y: 0.48 },
    { x: 0.55, y: 0.48 }, { x: 0.55, y: 0.62 },
  ]},
  // Top-right → below logo
  { nodes: [
    { x: 0.92, y: 0.15 }, { x: 0.82, y: 0.15 }, { x: 0.82, y: 0.48 },
    { x: 0.45, y: 0.48 }, { x: 0.45, y: 0.62 },
  ]},
  // Left edge → center → bottom
  { nodes: [
    { x: 0.0, y: 0.50 }, { x: 0.22, y: 0.50 }, { x: 0.38, y: 0.50 },
    { x: 0.38, y: 0.66 }, { x: 0.38, y: 0.85 },
  ]},
  // Right edge → center → bottom
  { nodes: [
    { x: 1.0, y: 0.50 }, { x: 0.78, y: 0.50 }, { x: 0.62, y: 0.50 },
    { x: 0.62, y: 0.66 }, { x: 0.62, y: 0.85 },
  ]},
  // Left diagonal down
  { nodes: [
    { x: 0.0, y: 0.42 }, { x: 0.12, y: 0.42 }, { x: 0.12, y: 0.58 },
    { x: 0.25, y: 0.58 }, { x: 0.25, y: 0.72 },
  ]},
  // Right diagonal down
  { nodes: [
    { x: 1.0, y: 0.42 }, { x: 0.88, y: 0.42 }, { x: 0.88, y: 0.58 },
    { x: 0.75, y: 0.58 }, { x: 0.75, y: 0.72 },
  ]},

  // === CORNER CLUSTERS — Top-left ===
  { nodes: [{ x: 0.02, y: 0.04 }, { x: 0.14, y: 0.04 }, { x: 0.14, y: 0.16 }] },
  { nodes: [{ x: 0.02, y: 0.12 }, { x: 0.06, y: 0.12 }, { x: 0.06, y: 0.24 }, { x: 0.02, y: 0.24 }] },
  { nodes: [{ x: 0.04, y: 0.02 }, { x: 0.04, y: 0.08 }, { x: 0.12, y: 0.08 }] },
  { nodes: [{ x: 0.10, y: 0.02 }, { x: 0.10, y: 0.12 }, { x: 0.16, y: 0.12 }] },
  { nodes: [{ x: 0.02, y: 0.18 }, { x: 0.08, y: 0.18 }, { x: 0.08, y: 0.30 }] },
  { nodes: [{ x: 0.14, y: 0.08 }, { x: 0.14, y: 0.14 }, { x: 0.20, y: 0.14 }] },

  // === CORNER CLUSTERS — Top-right ===
  { nodes: [{ x: 0.98, y: 0.04 }, { x: 0.86, y: 0.04 }, { x: 0.86, y: 0.16 }] },
  { nodes: [{ x: 0.98, y: 0.12 }, { x: 0.94, y: 0.12 }, { x: 0.94, y: 0.24 }, { x: 0.98, y: 0.24 }] },
  { nodes: [{ x: 0.96, y: 0.02 }, { x: 0.96, y: 0.08 }, { x: 0.88, y: 0.08 }] },
  { nodes: [{ x: 0.90, y: 0.02 }, { x: 0.90, y: 0.12 }, { x: 0.84, y: 0.12 }] },
  { nodes: [{ x: 0.98, y: 0.18 }, { x: 0.92, y: 0.18 }, { x: 0.92, y: 0.30 }] },
  { nodes: [{ x: 0.86, y: 0.08 }, { x: 0.86, y: 0.14 }, { x: 0.80, y: 0.14 }] },

  // === CORNER CLUSTERS — Bottom-left ===
  { nodes: [{ x: 0.02, y: 0.82 }, { x: 0.12, y: 0.82 }, { x: 0.12, y: 0.92 }, { x: 0.22, y: 0.92 }] },
  { nodes: [{ x: 0.02, y: 0.88 }, { x: 0.06, y: 0.88 }, { x: 0.06, y: 0.98 }] },
  { nodes: [{ x: 0.04, y: 0.78 }, { x: 0.16, y: 0.78 }, { x: 0.16, y: 0.88 }] },
  { nodes: [{ x: 0.10, y: 0.86 }, { x: 0.10, y: 0.94 }, { x: 0.18, y: 0.94 }] },
  { nodes: [{ x: 0.02, y: 0.96 }, { x: 0.14, y: 0.96 }, { x: 0.14, y: 0.88 }] },

  // === CORNER CLUSTERS — Bottom-right ===
  { nodes: [{ x: 0.98, y: 0.82 }, { x: 0.88, y: 0.82 }, { x: 0.88, y: 0.92 }, { x: 0.78, y: 0.92 }] },
  { nodes: [{ x: 0.98, y: 0.88 }, { x: 0.94, y: 0.88 }, { x: 0.94, y: 0.98 }] },
  { nodes: [{ x: 0.96, y: 0.78 }, { x: 0.84, y: 0.78 }, { x: 0.84, y: 0.88 }] },
  { nodes: [{ x: 0.90, y: 0.86 }, { x: 0.90, y: 0.94 }, { x: 0.82, y: 0.94 }] },
  { nodes: [{ x: 0.98, y: 0.96 }, { x: 0.86, y: 0.96 }, { x: 0.86, y: 0.88 }] },

  // === MID-SIDE BRANCHES ===

  // Left side
  { nodes: [{ x: 0.0, y: 0.35 }, { x: 0.06, y: 0.35 }, { x: 0.06, y: 0.42 }] },
  { nodes: [{ x: 0.0, y: 0.65 }, { x: 0.10, y: 0.65 }, { x: 0.10, y: 0.58 }] },
  { nodes: [{ x: 0.04, y: 0.48 }, { x: 0.04, y: 0.56 }, { x: 0.12, y: 0.56 }] },
  { nodes: [{ x: 0.0, y: 0.74 }, { x: 0.08, y: 0.74 }, { x: 0.08, y: 0.68 }] },

  // Right side
  { nodes: [{ x: 1.0, y: 0.35 }, { x: 0.94, y: 0.35 }, { x: 0.94, y: 0.42 }] },
  { nodes: [{ x: 1.0, y: 0.65 }, { x: 0.90, y: 0.65 }, { x: 0.90, y: 0.58 }] },
  { nodes: [{ x: 0.96, y: 0.48 }, { x: 0.96, y: 0.56 }, { x: 0.88, y: 0.56 }] },
  { nodes: [{ x: 1.0, y: 0.74 }, { x: 0.92, y: 0.74 }, { x: 0.92, y: 0.68 }] },

  // === BOTTOM CENTER ===
  { nodes: [{ x: 0.30, y: 0.90 }, { x: 0.42, y: 0.90 }, { x: 0.42, y: 0.96 }] },
  { nodes: [{ x: 0.58, y: 0.90 }, { x: 0.70, y: 0.90 }, { x: 0.70, y: 0.96 }] },
  { nodes: [{ x: 0.45, y: 0.86 }, { x: 0.50, y: 0.86 }, { x: 0.50, y: 0.94 }] },
  { nodes: [{ x: 0.55, y: 0.86 }, { x: 0.50, y: 0.86 }, { x: 0.50, y: 0.98 }] },

  // === INNER GRID — additional horizontal fill between logo zone and bottom ===
  { nodes: [{ x: 0.22, y: 0.62 }, { x: 0.42, y: 0.62 }, { x: 0.42, y: 0.68 }] },
  { nodes: [{ x: 0.78, y: 0.62 }, { x: 0.58, y: 0.62 }, { x: 0.58, y: 0.68 }] },
  { nodes: [{ x: 0.28, y: 0.68 }, { x: 0.28, y: 0.76 }, { x: 0.42, y: 0.76 }] },
  { nodes: [{ x: 0.72, y: 0.68 }, { x: 0.72, y: 0.76 }, { x: 0.58, y: 0.76 }] },
  { nodes: [{ x: 0.22, y: 0.76 }, { x: 0.32, y: 0.76 }, { x: 0.32, y: 0.84 }] },
  { nodes: [{ x: 0.78, y: 0.76 }, { x: 0.68, y: 0.76 }, { x: 0.68, y: 0.84 }] },

  // === LOGO FRAME TRACES ===

  // Arc over top
  { nodes: [
    { x: 0.20, y: 0.12 }, { x: 0.30, y: 0.12 }, { x: 0.30, y: 0.06 },
    { x: 0.70, y: 0.06 }, { x: 0.70, y: 0.12 }, { x: 0.80, y: 0.12 },
  ]},
  // Left side frame
  { nodes: [{ x: 0.20, y: 0.14 }, { x: 0.20, y: 0.30 }, { x: 0.20, y: 0.46 }] },
  // Right side frame
  { nodes: [{ x: 0.80, y: 0.14 }, { x: 0.80, y: 0.30 }, { x: 0.80, y: 0.46 }] },
  // Below logo connector
  { nodes: [
    { x: 0.20, y: 0.46 }, { x: 0.32, y: 0.46 }, { x: 0.32, y: 0.50 },
    { x: 0.68, y: 0.50 }, { x: 0.68, y: 0.46 }, { x: 0.80, y: 0.46 },
  ]},
  // Second arc over top (tighter)
  { nodes: [
    { x: 0.24, y: 0.16 }, { x: 0.36, y: 0.16 }, { x: 0.36, y: 0.10 },
    { x: 0.64, y: 0.10 }, { x: 0.64, y: 0.16 }, { x: 0.76, y: 0.16 },
  ]},

  // === ADDITIONAL GRID FILL ===

  // More horizontals — top area
  { nodes: [{ x: 0.0, y: 0.06 }, { x: 0.06, y: 0.06 }, { x: 0.06, y: 0.14 }] },
  { nodes: [{ x: 1.0, y: 0.06 }, { x: 0.94, y: 0.06 }, { x: 0.94, y: 0.14 }] },
  { nodes: [{ x: 0.02, y: 0.32 }, { x: 0.12, y: 0.32 }, { x: 0.12, y: 0.38 }, { x: 0.18, y: 0.38 }] },
  { nodes: [{ x: 0.98, y: 0.32 }, { x: 0.88, y: 0.32 }, { x: 0.88, y: 0.38 }, { x: 0.82, y: 0.38 }] },

  // Horizontal — very top
  { nodes: [
    { x: 0.0, y: 0.03 }, { x: 0.08, y: 0.03 }, { x: 0.15, y: 0.03 },
  ]},
  { nodes: [
    { x: 1.0, y: 0.03 }, { x: 0.92, y: 0.03 }, { x: 0.85, y: 0.03 },
  ]},

  // More verticals — inner grid below logo
  { nodes: [{ x: 0.28, y: 0.48 }, { x: 0.28, y: 0.58 }, { x: 0.28, y: 0.68 }] },
  { nodes: [{ x: 0.72, y: 0.48 }, { x: 0.72, y: 0.58 }, { x: 0.72, y: 0.68 }] },
  { nodes: [{ x: 0.42, y: 0.52 }, { x: 0.42, y: 0.62 }, { x: 0.42, y: 0.72 }] },
  { nodes: [{ x: 0.58, y: 0.52 }, { x: 0.58, y: 0.62 }, { x: 0.58, y: 0.72 }] },

  // Horizontal fills in mid area
  { nodes: [{ x: 0.18, y: 0.64 }, { x: 0.28, y: 0.64 }, { x: 0.35, y: 0.64 }] },
  { nodes: [{ x: 0.82, y: 0.64 }, { x: 0.72, y: 0.64 }, { x: 0.65, y: 0.64 }] },
  { nodes: [{ x: 0.22, y: 0.56 }, { x: 0.32, y: 0.56 }, { x: 0.32, y: 0.62 }] },
  { nodes: [{ x: 0.78, y: 0.56 }, { x: 0.68, y: 0.56 }, { x: 0.68, y: 0.62 }] },

  // Extra short stubs — left side
  { nodes: [{ x: 0.0, y: 0.22 }, { x: 0.04, y: 0.22 }, { x: 0.04, y: 0.28 }] },
  { nodes: [{ x: 0.0, y: 0.46 }, { x: 0.06, y: 0.46 }] },
  { nodes: [{ x: 0.12, y: 0.32 }, { x: 0.12, y: 0.42 }] },

  // Extra short stubs — right side
  { nodes: [{ x: 1.0, y: 0.22 }, { x: 0.96, y: 0.22 }, { x: 0.96, y: 0.28 }] },
  { nodes: [{ x: 1.0, y: 0.46 }, { x: 0.94, y: 0.46 }] },
  { nodes: [{ x: 0.88, y: 0.32 }, { x: 0.88, y: 0.42 }] },

  // Horizontal — bottom area fill
  { nodes: [{ x: 0.08, y: 0.88 }, { x: 0.22, y: 0.88 }, { x: 0.22, y: 0.82 }] },
  { nodes: [{ x: 0.92, y: 0.88 }, { x: 0.78, y: 0.88 }, { x: 0.78, y: 0.82 }] },
  { nodes: [{ x: 0.30, y: 0.78 }, { x: 0.45, y: 0.78 }] },
  { nodes: [{ x: 0.70, y: 0.78 }, { x: 0.55, y: 0.78 }] },
  { nodes: [{ x: 0.38, y: 0.88 }, { x: 0.50, y: 0.88 }, { x: 0.62, y: 0.88 }] },

  // Cross-connectors in bottom half
  { nodes: [{ x: 0.15, y: 0.72 }, { x: 0.15, y: 0.82 }] },
  { nodes: [{ x: 0.85, y: 0.72 }, { x: 0.85, y: 0.82 }] },
  { nodes: [{ x: 0.25, y: 0.82 }, { x: 0.25, y: 0.92 }] },
  { nodes: [{ x: 0.75, y: 0.82 }, { x: 0.75, y: 0.92 }] },
];

function getTraceLength(trace: Trace, w: number, h: number): number {
  let len = 0;
  for (let i = 1; i < trace.nodes.length; i++) {
    const dx = (trace.nodes[i].x - trace.nodes[i - 1].x) * w;
    const dy = (trace.nodes[i].y - trace.nodes[i - 1].y) * h;
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}

function getPointOnTrace(trace: Trace, progress: number, w: number, h: number): { x: number; y: number } {
  const totalLen = getTraceLength(trace, w, h);
  let targetDist = progress * totalLen;

  for (let i = 1; i < trace.nodes.length; i++) {
    const x0 = trace.nodes[i - 1].x * w;
    const y0 = trace.nodes[i - 1].y * h;
    const x1 = trace.nodes[i].x * w;
    const y1 = trace.nodes[i].y * h;
    const segLen = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);

    if (targetDist <= segLen) {
      const t = segLen > 0 ? targetDist / segLen : 0;
      return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t };
    }
    targetDist -= segLen;
  }

  const last = trace.nodes[trace.nodes.length - 1];
  return { x: last.x * w, y: last.y * h };
}

function buildTraceSubPath(
  ctx: CanvasRenderingContext2D,
  trace: Trace,
  startProgress: number,
  endProgress: number,
  w: number,
  h: number,
) {
  const totalLen = getTraceLength(trace, w, h);
  const startDist = startProgress * totalLen;
  const endDist = endProgress * totalLen;
  let accumulated = 0;
  let started = false;

  ctx.beginPath();

  for (let i = 1; i < trace.nodes.length; i++) {
    const x0 = trace.nodes[i - 1].x * w;
    const y0 = trace.nodes[i - 1].y * h;
    const x1 = trace.nodes[i].x * w;
    const y1 = trace.nodes[i].y * h;
    const segLen = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
    const segStart = accumulated;
    const segEnd = accumulated + segLen;

    if (segEnd > startDist && segStart < endDist) {
      const clampStart = Math.max(startDist, segStart);
      const clampEnd = Math.min(endDist, segEnd);
      const t0 = segLen > 0 ? (clampStart - segStart) / segLen : 0;
      const t1 = segLen > 0 ? (clampEnd - segStart) / segLen : 1;

      const px0 = x0 + (x1 - x0) * t0;
      const py0 = y0 + (y1 - y0) * t0;
      const px1 = x0 + (x1 - x0) * t1;
      const py1 = y0 + (y1 - y0) * t1;

      if (!started) {
        ctx.moveTo(px0, py0);
        started = true;
      } else {
        ctx.lineTo(px0, py0);
      }
      ctx.lineTo(px1, py1);
    }

    accumulated += segLen;
    if (accumulated > endDist) break;
  }
}

function isInLogoZone(nx: number, ny: number): boolean {
  return nx > LOGO_ZONE.x1 && nx < LOGO_ZONE.x2 && ny > LOGO_ZONE.y1 && ny < LOGO_ZONE.y2;
}

export default function CircuitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const pulsesRef = useRef<Pulse[]>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      canvas!.style.width = window.innerWidth + 'px';
      canvas!.style.height = window.innerHeight + 'px';
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // Initialize pulses — only 1 per trace, ~30% of traces get none
    if (!initializedRef.current) {
      const pulses: Pulse[] = [];
      for (let i = 0; i < TRACES.length; i++) {
        if (Math.random() < 0.3) continue; // 30% of traces have no pulse
        pulses.push({
          traceIdx: i,
          progress: Math.random(),
          speed: 0.015 + Math.random() * 0.03, // very slow: 0.015–0.045
          size: 1.2 + Math.random() * 0.8,
          opacity: 0.5 + Math.random() * 0.5,
          direction: Math.random() > 0.5 ? 1 : -1,
        });
      }
      pulsesRef.current = pulses;
      initializedRef.current = true;
    }

    let lastTime = 0;

    function draw(time: number) {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx!.clearRect(0, 0, w, h);

      // === Pass 1: Draw dim base traces ===
      ctx!.shadowBlur = 0;
      ctx!.shadowColor = 'transparent';
      for (const trace of TRACES) {
        ctx!.beginPath();
        ctx!.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx!.lineWidth = 1;
        ctx!.lineCap = 'round';
        ctx!.lineJoin = 'round';

        for (let i = 0; i < trace.nodes.length; i++) {
          const x = trace.nodes[i].x * w;
          const y = trace.nodes[i].y * h;
          if (i === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.stroke();

        // Junction dots only at endpoints and corners
        for (let ni = 0; ni < trace.nodes.length; ni++) {
          if (ni > 0 && ni < trace.nodes.length - 1) {
            const prev = trace.nodes[ni - 1];
            const curr = trace.nodes[ni];
            const next = trace.nodes[ni + 1];
            const dx1 = curr.x - prev.x;
            const dy1 = curr.y - prev.y;
            const dx2 = next.x - curr.x;
            const dy2 = next.y - curr.y;
            if (Math.abs(dx1 * dy2 - dy1 * dx2) < 0.001) continue;
          }
          const node = trace.nodes[ni];
          const inZone = isInLogoZone(node.x, node.y);
          ctx!.beginPath();
          ctx!.arc(node.x * w, node.y * h, inZone ? 0.6 : 1.0, 0, Math.PI * 2);
          ctx!.fillStyle = inZone
            ? 'rgba(255, 255, 255, 0.02)'
            : 'rgba(255, 255, 255, 0.06)';
          ctx!.fill();
        }
      }

      // === Pass 2: Glowing dots traveling along traces ===
      for (const pulse of pulsesRef.current) {
        pulse.progress += pulse.speed * dt * pulse.direction;

        if (pulse.progress > 1) {
          pulse.progress = 1;
          pulse.direction = -1;
        } else if (pulse.progress < 0) {
          pulse.progress = 0;
          pulse.direction = 1;
        }

        const trace = TRACES[pulse.traceIdx];
        const traceLen = getTraceLength(trace, w, h);
        const pos = getPointOnTrace(trace, pulse.progress, w, h);

        const nx = pos.x / w;
        const ny = pos.y / h;
        const inZone = isInLogoZone(nx, ny);
        const zoneFade = inZone ? 0.08 : 1.0;
        const alpha = pulse.opacity * zoneFade;

        // --- Tight radial glow — small spread, not firefly-like ---
        const outerR = 5 + pulse.size * 2;
        const grad = ctx!.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, outerR);
        grad.addColorStop(0, `rgba(255, 255, 255, ${0.4 * alpha})`);
        grad.addColorStop(0.4, `rgba(230, 235, 245, ${0.1 * alpha})`);
        grad.addColorStop(1, 'rgba(220, 225, 235, 0)');
        ctx!.beginPath();
        ctx!.arc(pos.x, pos.y, outerR, 0, Math.PI * 2);
        ctx!.fillStyle = grad;
        ctx!.fill();

        // --- Tiny bright trace segment at the pulse point ---
        const tinyFrac = Math.min(4 / traceLen, 0.1);
        const segStart = Math.max(0, pulse.progress - tinyFrac * 0.5);
        const segEnd = Math.min(1, pulse.progress + tinyFrac * 0.5);

        ctx!.lineCap = 'round';
        ctx!.lineJoin = 'round';
        ctx!.shadowColor = `rgba(255, 255, 255, ${0.4 * alpha})`;
        ctx!.shadowBlur = 4;
        buildTraceSubPath(ctx!, trace, segStart, segEnd, w, h);
        ctx!.strokeStyle = `rgba(240, 245, 255, ${0.35 * alpha})`;
        ctx!.lineWidth = 1.5;
        ctx!.stroke();

        // --- Bright core dot ---
        ctx!.shadowBlur = 2;
        ctx!.shadowColor = `rgba(255, 255, 255, ${0.5 * alpha})`;
        ctx!.beginPath();
        ctx!.arc(pos.x, pos.y, pulse.size * 0.5, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(245, 248, 255, ${0.7 * alpha})`;
        ctx!.fill();
      }

      // Reset shadow state
      ctx!.shadowBlur = 0;
      ctx!.shadowColor = 'transparent';

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      {/* Black vignette overlay — fades edges to black */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: `
            radial-gradient(
              ellipse 70% 65% at 50% 45%,
              transparent 0%,
              transparent 40%,
              rgba(8, 8, 10, 0.3) 65%,
              rgba(8, 8, 10, 0.7) 80%,
              rgba(8, 8, 10, 0.95) 100%
            )
          `,
        }}
      />
    </>
  );
}
