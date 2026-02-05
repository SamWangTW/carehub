import type { VitalReading } from "../../../types/vital";

type Props = {
  readings: VitalReading[];
};

export default function VitalsChart({ readings }: Props) {
  if (readings.length === 0) {
    return <p style={{ marginTop: 12 }}>No vitals recorded.</p>;
  }

  const sorted = [...readings].sort((a, b) =>
    a.recordedAt.localeCompare(b.recordedAt)
  );

  const values = sorted.map((r) => r.systolic);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const width = 520;
  const height = 220;
  const padding = { top: 16, right: 16, bottom: 56, left: 80 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const points = values.map((v, i) => {
    const x =
      padding.left + (i / Math.max(1, values.length - 1)) * plotWidth;
    const y =
      padding.top +
      (1 - (v - min) / Math.max(1, max - min)) * plotHeight;
    return `${x},${y}`;
  });

  const formatShortDate = (iso: string) => {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${mm}/${dd}`;
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ color: "#cfcfcf", marginBottom: 6, fontSize: 13 }}>
        Blood Pressure Trend (Last {values.length} Readings)
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ border: "1px solid #2a2a2a", borderRadius: 6 }}
      >
        {/* Axes */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#444"
        />
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="#444"
        />

        {/* Y-axis labels */}
        <text
          x={padding.left / 2}
          y={padding.top + plotHeight / 2}
          fill="#cfcfcf"
          fontSize="12"
          textAnchor="middle"
          transform={`rotate(-90 ${padding.left / 2} ${
            padding.top + plotHeight / 2
          })`}
        >
          Blood Pressure (mmHg)
        </text>
        <text
          x={padding.left - 6}
          y={padding.top + 4}
          fill="#cfcfcf"
          fontSize="10"
          textAnchor="end"
        >
          {max}
        </text>
        <text
          x={padding.left - 6}
          y={height - padding.bottom}
          fill="#cfcfcf"
          fontSize="10"
          textAnchor="end"
          dy="4"
        >
          {min}
        </text>

        {/* X-axis label */}
        <text
          x={(padding.left + (width - padding.right)) / 2}
          y={height - 6}
          fill="#cfcfcf"
          fontSize="12"
          textAnchor="middle"
        >
          Date
        </text>
        {sorted.map((r, i) => {
          const x =
            padding.left + (i / Math.max(1, sorted.length - 1)) * plotWidth;
          return (
            <g key={r.id}>
              <line
                x1={x}
                y1={height - padding.bottom}
                x2={x}
                y2={height - padding.bottom + 6}
                stroke="#444"
              />
              <text
                x={x}
                y={height - padding.bottom + 22}
                fill="#9aa0a6"
                fontSize="10"
                textAnchor="end"
                transform={`rotate(-35 ${x} ${
                  height - padding.bottom + 22
                })`}
              >
                {formatShortDate(r.recordedAt)}
              </text>
            </g>
          );
        })}

        <polyline
          fill="none"
          stroke="#2d6cdf"
          strokeWidth="2"
          points={points.join(" ")}
        />
        {points.map((p, i) => {
          const [x, y] = p.split(",");
          return <circle key={i} cx={x} cy={y} r={3} fill="#2d6cdf" />;
        })}
      </svg>
      <p style={{ marginTop: 8, color: "#666" }}>
        Systolic BP (last {values.length} readings)
      </p>
    </div>
  );
}
