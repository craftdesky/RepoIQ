import React, { useEffect, useRef } from "react";
import cytoscape from "cytoscape";

export default function DependencyGraph({ graphData, onSelectNode, hotspots, highlightNode }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    // Map graphData nodes & edges to Cytoscape elements
    const elements = [];

    if (Array.isArray(graphData.nodes)) {
      graphData.nodes.forEach((node) => {
        elements.push({
          data: {
            id: node.id,
            label: node.id.split("/").pop(), // simple filename label
            fullName: node.id,
            sizeBytes: node.sizeBytes || 0,
            lineCount: node.lineCount || 0,
          },
        });
      });
    }

    if (Array.isArray(graphData.edges)) {
      graphData.edges.forEach((edge, index) => {
        elements.push({
          data: {
            id: `edge-${index}`,
            source: edge.from,
            target: edge.to,
          },
        });
      });
    }

    // Initialize Cytoscape
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#ffffff",
            "border-color": "#374151",
            "border-width": 1.5,
            label: "data(label)",
            "font-size": "10px",
            "font-family": "Inter, sans-serif",
            "text-valign": "bottom",
            "text-margin-y": 6,
            color: "#374151",
            width: "30px",
            height: "30px",
            "overlay-padding": "6px",
            "overlay-opacity": 0,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1,
            "line-color": "#d1d5db",
            "target-arrow-color": "#d1d5db",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-color": "#111827",
            "border-width": 3,
            "background-color": "#f3f4f6",
          },
        },
      ],
      layout: {
        name: "cose",
        idealEdgeLength: 100,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        padding: 30,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: 400000,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0,
      },
    });

    cyRef.current.on("tap", "node", (evt) => {
      const node = evt.target;
      if (onSelectNode) {
        onSelectNode(node.data("fullName"));
      }
    });

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [graphData, onSelectNode]);

  // Apply hotspots styling and handle highlight changes
  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cyRef.current;

    // Build a flexible hotspot lookup: full path, normalized, basename, and suffix matches
    const hotspotMap = new Map();
    if (Array.isArray(hotspots)) {
      hotspots.forEach((h) => {
        const rawId = (h && (h.id || h.file || "")) || "";
        const norm = String(rawId).replaceAll("\\", "/");
        const base = norm.split("/").pop();

        hotspotMap.set(norm, h.hotspotScore);
        hotspotMap.set(rawId, h.hotspotScore);
        hotspotMap.set(base, h.hotspotScore);
        if (norm.startsWith("./")) hotspotMap.set(norm.slice(2), h.hotspotScore);
      });
    }

    cy.nodes().forEach((node) => {
      const full = node.data("fullName") || node.id();
      const id = String(full).replaceAll("\\", "/");
      const base = id.split("/").pop();

      let score = null;
      if (hotspotMap.has(id)) score = hotspotMap.get(id);
      else if (hotspotMap.has(node.id())) score = hotspotMap.get(node.id());
      else if (hotspotMap.has(base)) score = hotspotMap.get(base);
      else {
        // suffix match (e.g., repo-root differences)
        for (const [k, v] of hotspotMap.entries()) {
          if (typeof k === "string" && k.length > 3 && id.endsWith(k)) {
            score = v;
            break;
          }
        }
      }

      let bg = "#ffffff";
      let size = 30;

      if (score !== null && score !== undefined) {
        if (score >= 80) bg = "#ef4444"; // red
        else if (score >= 60) bg = "#f97316"; // orange
        else if (score >= 30) bg = "#facc15"; // yellow
        else bg = "#10b981"; // green

        size = 30 + Math.round((score / 100) * 24);
      }

      node.style({
        "background-color": bg,
        width: `${size}px`,
        height: `${size}px`
      });
    });

    // Handle node highlight/selection with flexible id matching
    cy.nodes().unselect();
    if (highlightNode) {
      const hNorm = String(highlightNode).replaceAll("\\", "/");
      let target = cy.getElementById(hNorm);
      if (!target || target.length === 0) target = cy.getElementById(String(highlightNode));
      if ((!target || target.length === 0) && hNorm.includes("/")) {
        // try to find by fullName or basename
        target = cy.nodes().filter((n) => {
          const fn = String(n.data("fullName") || n.id()).replaceAll("\\", "/");
          const bn = fn.split("/").pop();
          return fn === hNorm || bn === hNorm || fn.endsWith(hNorm) || bn === hNorm.split("/").pop();
        });
      }

      if (target && target.length > 0) {
        target.select();
        try {
          cy.animate({ center: { eles: target }, duration: 300 });
        } catch (e) {
          // ignore animation errors
        }
      }
    }
  }, [hotspots, highlightNode]);

  const handleReset = () => {
    if (cyRef.current) {
      cyRef.current.animate({
        fit: { padding: 30 },
        duration: 300
      });
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "transparent",
        }}
      />
      <button
        onClick={handleReset}
        title="Reset Graph View"
        style={{
          position: "absolute",
          bottom: "16px",
          right: "16px",
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "6px",
          padding: "8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          color: "#374151",
          transition: "background-color 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
    </div>
  );
}
