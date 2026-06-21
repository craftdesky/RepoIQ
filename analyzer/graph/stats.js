const path = require("path");
const { buildGraph } = require("./graphBuilder");
const { getNodes, getEdges } = require("./graphUtils");

function countByExtension(nodes) {
    const counts = {};

    for (const node of nodes) {
        const extension = node.extension || "unknown";
        counts[extension] = (counts[extension] || 0) + 1;
    }

    return counts;
}

function rankByConnectivity(nodes, limit) {
    return [...nodes]
        .map((node) => ({
            id: node.id,
            incoming: node.incoming || 0,
            outgoing: node.outgoing || 0,
            totalConnections: (node.incoming || 0) + (node.outgoing || 0)
        }))
        .sort((a, b) => {
            if (b.totalConnections !== a.totalConnections) {
                return b.totalConnections - a.totalConnections;
            }

            if (b.incoming !== a.incoming) {
                return b.incoming - a.incoming;
            }

            return a.id.localeCompare(b.id);
        })
        .slice(0, limit);
}

function getIsolatedNodes(nodes) {
    return nodes
        .filter((node) => (node.incoming || 0) === 0 && (node.outgoing || 0) === 0)
        .map((node) => node.id);
}

function getEntryNodes(nodes) {
    return nodes
        .filter((node) => (node.incoming || 0) === 0 && (node.outgoing || 0) > 0)
        .map((node) => node.id);
}

function getLeafNodes(nodes) {
    return nodes
        .filter((node) => (node.incoming || 0) > 0 && (node.outgoing || 0) === 0)
        .map((node) => node.id);
}

function getDensity(nodeCount, edgeCount) {
    if (nodeCount <= 1) {
        return 0;
    }

    const maxDirectedEdges = nodeCount * (nodeCount - 1);
    return Number((edgeCount / maxDirectedEdges).toFixed(4));
}

function getAverage(value, count) {
    if (count === 0) {
        return 0;
    }

    return Number((value / count).toFixed(2));
}

function calculateGraphStats(graph, options = {}) {
    const nodes = getNodes(graph);
    const edges = getEdges(graph);
    const limit = options.limit || 10;
    const nodeCount = nodes.length;
    const edgeCount = edges.length;
    // compute total folders and total lines
    const folderSet = new Set();
    let totalLines = 0;

    for (const node of nodes) {
        try {
            const dir = path.posix.dirname(node.id || "");
            folderSet.add(dir === "" ? "." : dir);
        } catch (e) {
            // ignore
        }

        totalLines += node.lineCount || 0;
    }
    const isolatedNodes = getIsolatedNodes(nodes);
    const entryNodes = getEntryNodes(nodes);
    const leafNodes = getLeafNodes(nodes);
    const totalIncoming = nodes.reduce((sum, node) => sum + (node.incoming || 0), 0);
    const totalOutgoing = nodes.reduce((sum, node) => sum + (node.outgoing || 0), 0);

    return {
        nodeCount,
        edgeCount,
        density: getDensity(nodeCount, edgeCount),
        averageIncoming: getAverage(totalIncoming, nodeCount),
        averageOutgoing: getAverage(totalOutgoing, nodeCount),
        isolatedCount: isolatedNodes.length,
        entryNodeCount: entryNodes.length,
        leafNodeCount: leafNodes.length,
        filesByExtension: countByExtension(nodes),
        isolatedNodes,
        entryNodes,
        leafNodes,
        mostConnectedModules: rankByConnectivity(nodes, limit),
        mostDependedOnModules: [...nodes]
            .map((node) => ({
                id: node.id,
                incoming: node.incoming || 0
            }))
            .sort((a, b) => b.incoming - a.incoming || a.id.localeCompare(b.id))
            .slice(0, limit),
        modulesWithMostDependencies: [...nodes]
            .map((node) => ({
                id: node.id,
                outgoing: node.outgoing || 0
            }))
            .sort((a, b) => b.outgoing - a.outgoing || a.id.localeCompare(b.id))
            .slice(0, limit)
        ,
        totalFolders: folderSet.size,
        totalLines: totalLines
    };
}

module.exports = {
    calculateGraphStats,
    countByExtension,
    rankByConnectivity,
    getIsolatedNodes,
    getEntryNodes,
    getLeafNodes,
    getDensity
};


// printing for testing
if (require.main === module) {
    const repoPath = process.argv[2] || ".";
    const graph = buildGraph(repoPath);
    const stats = calculateGraphStats(graph);

    console.log(JSON.stringify(stats, null, 2));
}
