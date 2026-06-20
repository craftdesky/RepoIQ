import React, { useEffect, useRef } from "react";
import cytoscape from "cytoscape";

export default function DependencyGraph({ graphData, onSelectNode }) {
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
      }
    };
  }, [graphData]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "transparent",
      }}
    />
  );
}
