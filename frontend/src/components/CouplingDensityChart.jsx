import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

function getDir(fileId) {
  if (!fileId) return ".";
  const parts = fileId.split("/");
  parts.pop();
  return parts.length === 0 ? "." : parts.join("/");
}

export default function CouplingDensityChart({ graph, maxBars = 8 }) {
  const data = useMemo(() => {
    if (!graph) return [];
    const edges = Array.isArray(graph.edges) ? graph.edges : [];
    const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];

    const map = {};
    nodes.forEach((n) => {
      const d = getDir(n.id);
      if (!map[d]) map[d] = { dir: d, total: 0, external: 0 };
    });

    edges.forEach((edge) => {
      const from = edge.from || "";
      const to = edge.to || "";
      const d1 = getDir(from);
      const d2 = getDir(to);
      if (!map[d1]) map[d1] = { dir: d1, total: 0, external: 0 };
      map[d1].total += 1;
      if (d1 !== d2) map[d1].external += 1;
    });

    const arr = Object.values(map)
      .map((item) => ({
        dir: item.dir.split("/").pop() || item.dir,
        fullDir: item.dir,
        density: item.total === 0 ? 0 : Number(((item.external / item.total) * 100).toFixed(2)),
        external: item.external,
        total: item.total,
      }))
      .filter((x) => x.total > 0)
      .sort((a, b) => b.density - a.density);

    return arr.slice(0, maxBars);
  }, [graph, maxBars]);

  if (!data || data.length === 0) {
    return <div style={{ color: "#6b7280" }}>No coupling data available</div>;
  }

  return (
    <div style={{ width: "100%", height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <YAxis type="category" dataKey="dir" width={140} />
          <Tooltip formatter={(value) => `${value}%`} />
          <Bar dataKey="density" radius={[6, 6, 6, 6]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.density > 50 ? "#ef4444" : entry.density > 20 ? "#f59e0b" : "#10b981"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
