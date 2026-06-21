const path = require("path");
const { getEdges } = require("../graph/graphUtils");

function getDirectory(fileId) {
    if (!fileId) return ".";
    const dir = path.posix.dirname(fileId);
    return dir === "" ? "." : dir;
}

function calculateCouplingDensity(graph, options = {}) {
    const edges = getEdges(graph) || [];

    if (!edges.length) {
        return {
            externalLinks: 0,
            internalLinks: 0,
            totalLinks: 0,
            density: 0.0
        };
    }

    let externalLinks = 0;

    for (const edge of edges) {
        const d1 = getDirectory(edge.from || "");
        const d2 = getDirectory(edge.to || "");

        if (d1 !== d2) externalLinks += 1;
    }

    const totalLinks = edges.length;
    const internalLinks = totalLinks - externalLinks;
    const density = totalLinks === 0 ? 0 : Number((externalLinks / totalLinks).toFixed(4));

    return {
        externalLinks,
        internalLinks,
        totalLinks,
        density
    };
}

module.exports = {
    calculateCouplingDensity
};


// printing for testing
if (require.main === module) {
    const { buildGraph } = require("../graph/graphBuilder");
    const repoPath = process.argv[2] || ".";
    const graph = buildGraph(repoPath);
    console.log(JSON.stringify(calculateCouplingDensity(graph), null, 2));
}
