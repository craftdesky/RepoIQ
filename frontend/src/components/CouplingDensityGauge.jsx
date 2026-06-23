import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function CouplingDensityGauge({ density = 0, size = 140 }) {
  let pct = Number(density ?? 0);
  if (pct <= 1) pct = pct * 100; // accept 0..1 or 0..100
  pct = Number(Math.max(0, Math.min(100, pct)).toFixed(2));

  const data = [
    { name: "coupled", value: pct },
    { name: "rest", value: 100 - pct },
  ];

  const color = pct > 50 ? "#ef4444" : pct > 20 ? "#f59e0b" : "#10b981";
  const COLORS = [color, "#e5e7eb"];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <div style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              innerRadius={size / 2 - 26}
              outerRadius={size / 2 - 6}
              paddingAngle={0}
              cornerRadius={8}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{pct}%</div>
        <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Coupling Density</div>
      </div>
    </div>
  );
}
