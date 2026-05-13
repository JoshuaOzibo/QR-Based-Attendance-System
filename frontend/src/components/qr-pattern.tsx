import { useMemo } from "react";

/** Deterministic pseudo-QR pattern — purely visual (no real encoding). */
export function QrPattern({ seed = "default", size = 25 }: { seed?: string; size?: number }) {
  const cells = useMemo(() => {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const grid: boolean[] = [];
    for (let i = 0; i < size * size; i++) {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      grid.push((h & 1) === 1);
    }
    return grid;
  }, [seed, size]);

  const isFinder = (r: number, c: number) => {
    const inBox = (r0: number, c0: number) => r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7;
    return inBox(0, 0) || inBox(0, size - 7) || inBox(size - 7, 0);
  };
  const finderCell = (r: number, c: number) => {
    const local = (r0: number, c0: number) => {
      const lr = r - r0;
      const lc = c - c0;
      if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
      if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
      return false;
    };
    if (r < 7 && c < 7) return local(0, 0);
    if (r < 7 && c >= size - 7) return local(0, size - 7);
    if (r >= size - 7 && c < 7) return local(size - 7, 0);
    return false;
  };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full" shapeRendering="crispEdges">
      <rect width={size} height={size} fill="white" />
      {Array.from({ length: size }).map((_, r) =>
        Array.from({ length: size }).map((__, c) => {
          const finder = isFinder(r, c);
          const fill = finder ? finderCell(r, c) : cells[r * size + c];
          if (!fill) return null;
          return <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#0f172a" />;
        }),
      )}
    </svg>
  );
}
