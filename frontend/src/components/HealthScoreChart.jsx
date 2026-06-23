import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function HealthScoreChart({ score = 0, size = 140 }) {
  const pct = Math.max(0, Math.min(100, Number(score || 0)));
  const data = [
    { name: "score", value: pct },
    { name: "rest", value: 100 - pct },
  ];
  const COLORS = ["#10b981", "#e5e7eb"];

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
        <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Architectural Health</div>
      </div>
    </div>
  );
}
