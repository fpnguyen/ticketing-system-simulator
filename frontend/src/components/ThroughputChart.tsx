import { useMemo, useState } from 'react';
import { useSimulationStore } from '../state/useSimulationStore';

const WIDTH = 600;
const HEIGHT = 160;
const PAD_LEFT = 34;
const PAD_RIGHT = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 20;

export function ThroughputChart() {
  const history = useSimulationStore((s) => s.metricsHistory);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const maxThroughput = useMemo(() => {
    const max = Math.max(1, ...history.map((m) => m.throughputPerSec));
    return Math.ceil(max);
  }, [history]);

  const points = useMemo(
    () =>
      history.map((m, i) => {
        const x = history.length > 1 ? PAD_LEFT + (i / (history.length - 1)) * plotWidth : PAD_LEFT;
        const y = PAD_TOP + plotHeight - (m.throughputPerSec / maxThroughput) * plotHeight;
        return { x, y, metric: m };
      }),
    [history, maxThroughput, plotWidth, plotHeight],
  );

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1].x.toFixed(1)},${PAD_TOP + plotHeight} L${points[0].x.toFixed(1)},${PAD_TOP + plotHeight} Z`
      : '';

  const current = history[history.length - 1];
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    if (points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let bestDist = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.x - px);
      if (d < bestDist) {
        bestDist = d;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3>Throughput</h3>
        <span className="muted" style={{ fontSize: 12 }}>
          requests / sec
        </span>
      </div>
      {history.length === 0 ? (
        <p className="muted" style={{ marginTop: 12 }}>
          Run a simulation to see live throughput.
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          height={HEIGHT}
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
          style={{ marginTop: 8, display: 'block' }}
        >
          {[0, 0.5, 1].map((t) => {
            const y = PAD_TOP + plotHeight * (1 - t);
            return (
              <g key={t}>
                <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y} y2={y} stroke="var(--gridline)" strokeWidth={1} />
                <text x={PAD_LEFT - 6} y={y + 3} textAnchor="end" fontSize={10} fill="var(--text-muted)">
                  {(maxThroughput * t).toFixed(1)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="var(--series-blue)" opacity={0.1} stroke="none" />
          <path d={linePath} fill="none" stroke="var(--series-blue)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {current && (
            <>
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={4} fill="var(--series-blue)" stroke="var(--surface-1)" strokeWidth={2} />
              <text
                x={points[points.length - 1].x - 6}
                y={points[points.length - 1].y - 8}
                textAnchor="end"
                fontSize={11}
                fontWeight={600}
                fill="var(--text-primary)"
              >
                {current.throughputPerSec.toFixed(1)}
              </text>
            </>
          )}

          {hovered && (
            <g>
              <line x1={hovered.x} x2={hovered.x} y1={PAD_TOP} y2={PAD_TOP + plotHeight} stroke="var(--baseline)" strokeWidth={1} />
              <circle cx={hovered.x} cy={hovered.y} r={4} fill="var(--series-blue)" stroke="var(--surface-1)" strokeWidth={2} />
            </g>
          )}
        </svg>
      )}
      {hovered && (
        <div className="secondary" style={{ fontSize: 12, marginTop: 4 }}>
          <strong style={{ color: 'var(--text-primary)' }}>{hovered.metric.throughputPerSec.toFixed(2)} req/s</strong>
          {' · '}
          {hovered.metric.committedCount} committed / {hovered.metric.failedCount} failed
        </div>
      )}
    </div>
  );
}
