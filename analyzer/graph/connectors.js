const { getNodes, getEdges, normalizeId } = require("../graph/graphUtils");

// Build undirected adjacency list
function buildAdjacency(graph) {
    const nodes = getNodes(graph) || [];
    const edges = getEdges(graph) || [];
    const adj = new Map();

    for (const n of nodes) {
        const id = normalizeId(n.id);
        adj.set(id, new Set());
    }

    for (const e of edges) {
        const a = normalizeId(e.from || "");
        const b = normalizeId(e.to || "");
        if (!adj.has(a)) adj.set(a, new Set());
        if (!adj.has(b)) adj.set(b, new Set());

        adj.get(a).add(b);
        adj.get(b).add(a);
    }

    return adj;
}

// Connected components
function connectedComponents(adj, exclude = null) {
    const seen = new Set();
    const comps = [];
    for (const node of adj.keys()) {
        if (node === exclude) continue;
        if (seen.has(node)) continue;
        const stack = [node];
        const comp = [];
        seen.add(node);
        while (stack.length) {
            const u = stack.pop();
            comp.push(u);
            for (const v of adj.get(u) || []) {
                if (v === exclude) continue;
                if (!seen.has(v)) {
                    seen.add(v);
                    stack.push(v);
                }
            }
        }
        comps.push(comp);
    }
    return comps;
}

// Tarjan's algorithm for articulation points & bridges
function findArticulationPointsAndBridges(adj) {
    const ids = Array.from(adj.keys());
    const disc = new Map();
    const low = new Map();
    const visited = new Set();
    const parent = new Map();
    const apSet = new Set();
    const bridges = [];
    let time = 0;

    function dfs(u) {
        visited.add(u);
        disc.set(u, ++time);
        low.set(u, disc.get(u));
        let children = 0;

        for (const v of adj.get(u) || []) {
            if (!visited.has(v)) {
                parent.set(v, u);
                children++;
                dfs(v);
                low.set(u, Math.min(low.get(u), low.get(v)));

                // articulation point
                if (!parent.has(u) && children > 1) {
                    apSet.add(u);
                }
                if (parent.has(u) && low.get(v) >= disc.get(u)) {
                    apSet.add(u);
                }

                // bridge
                if (low.get(v) > disc.get(u)) {
                    bridges.push({ from: u, to: v });
                }
            } else if (v !== parent.get(u)) {
                // back edge
                low.set(u, Math.min(low.get(u), disc.get(v)));
            }
        }
    }

    for (const u of ids) {
        if (!visited.has(u)) dfs(u);
    }

    return { articulationPoints: Array.from(apSet), bridges };
}

// Brandes algorithm for betweenness centrality (unweighted)
function betweennessCentrality(adj) {
    const nodes = Array.from(adj.keys());
    const BC = new Map(nodes.map((n) => [n, 0]));

    for (const s of nodes) {
        const stack = [];
        const predecessors = new Map();
        const sigma = new Map();
        const dist = new Map();
        for (const v of nodes) {
            predecessors.set(v, []);
            sigma.set(v, 0);
            dist.set(v, -1);
        }
        sigma.set(s, 1);
        dist.set(s, 0);
        const queue = [s];

        while (queue.length) {
            const v = queue.shift();
            stack.push(v);
            for (const w of adj.get(v) || []) {
                if (dist.get(w) < 0) {
                    dist.set(w, dist.get(v) + 1);
                    queue.push(w);
                }
                if (dist.get(w) === dist.get(v) + 1) {
                    sigma.set(w, sigma.get(w) + sigma.get(v));
                    predecessors.get(w).push(v);
                }
            }
        }

        const delta = new Map(nodes.map((n) => [n, 0]));
        while (stack.length) {
            const w = stack.pop();
            for (const v of predecessors.get(w)) {
                delta.set(v, delta.get(v) + (sigma.get(v) / sigma.get(w)) * (1 + delta.get(w)));
            }
            if (w !== s) {
                BC.set(w, BC.get(w) + delta.get(w));
            }
        }
    }

    // Convert to array and normalize by dividing by 2 for undirected graphs
    const result = Array.from(BC.entries()).map(([id, score]) => ({ id, score: score / 2 }));
    result.sort((a, b) => b.score - a.score);
    return result;
}

function calculateConnectors(graph, options = {}) {
    const adj = buildAdjacency(graph);
    const nodes = Array.from(adj.keys());
    const totalNodes = nodes.length;

    // initial connected components
    const comps = connectedComponents(adj, null);
    const largestBefore = comps.reduce((m, c) => Math.max(m, c.length), 0);

    const { articulationPoints, bridges } = findArticulationPointsAndBridges(adj);

    // For each articulation point compute affected size (largest component change)
    const apDetails = articulationPoints.map((id) => {
        const compsAfter = connectedComponents(adj, id);
        const largestAfter = compsAfter.reduce((m, c) => Math.max(m, c.length), 0);
        const affected = Math.max(0, largestBefore - largestAfter);
        const percentAffected = totalNodes === 0 ? 0 : Number(((affected / totalNodes) * 100).toFixed(2));
        return { id, affected, percentAffected };
    }).sort((a, b) => b.affected - a.affected);

    const bridgeDetails = bridges.map((e) => ({ from: e.from, to: e.to }));

    const degree = nodes.map((id) => ({ id, degree: (adj.get(id) || new Set()).size })).sort((a, b) => b.degree - a.degree);

    const between = betweennessCentrality(adj);

    return {
        articulationPoints: apDetails,
        bridges: bridgeDetails,
        betweenness: between,
        degree,
        summary: {
            nodeCount: totalNodes,
            articulationCount: apDetails.length,
            bridgeCount: bridgeDetails.length
        }
    };
}

module.exports = {
    calculateConnectors,
    buildAdjacency,
    connectedComponents
};
