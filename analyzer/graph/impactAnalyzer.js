const { buildGraph } = require("./graphBuilder");
const { getNodes, getNode, normalizeId } = require("./graphUtils");

function buildReverseAdjacencyList(graph) {
    const reverseAdjacencyList = new Map();

    for (const node of getNodes(graph)) {
        reverseAdjacencyList.set(node.id, node.dependents || []);
    }

    return reverseAdjacencyList;
}

function getImpactScope(affectedCount) {
    if (affectedCount === 0) return "none";
    if (affectedCount <= 2) return "low";
    if (affectedCount <= 5) return "medium";
    return "high";
}

function analyzeImpact(graph, changedFileId, options = {}) {
    const fileId = normalizeId(changedFileId);
    const maxDepth = options.maxDepth || 30;
    const maxPaths = options.maxPaths || 100;
    const node = getNode(graph, fileId);

    if (!node) {
        return {
            file: fileId,
            exists: false,
            directDependents: [],
            affectedFiles: [],
            affectedCount: 0,
            impactScope: "unknown",
            paths: []
        };
    }

    const reverseAdjacencyList = buildReverseAdjacencyList(graph);
    const affected = new Set();
    const nodeDepths = new Map();
    const paths = [];
    const queue = (reverseAdjacencyList.get(fileId) || []).map((dependentId) => ({
        id: dependentId,
        path: [fileId, dependentId]
    }));

    while (queue.length > 0) {
        const current = queue.shift();
        const currentDepth = current.path.length - 1;

        if (currentDepth > maxDepth) {
            continue;
        }

        if (!affected.has(current.id)) {
            affected.add(current.id);
            nodeDepths.set(current.id, currentDepth);
        } else {
            if (currentDepth < nodeDepths.get(current.id)) {
                nodeDepths.set(current.id, currentDepth);
            }
        }

        if (paths.length < maxPaths) {
            paths.push({
                path: current.path,
                length: currentDepth
            });
        }

        for (const dependentId of reverseAdjacencyList.get(current.id) || []) {
            if (current.path.includes(dependentId)) {
                continue;
            }

            queue.push({
                id: dependentId,
                path: [...current.path, dependentId]
            });
        }
    }

    const affectedFiles = Array.from(affected);
    
    const tier1 = [];
    const tier2 = [];
    const tier3 = [];

    for (const id of affectedFiles) {
        const depth = nodeDepths.get(id);
        if (depth <= 2) tier1.push(id);
        else if (depth <= 4) tier2.push(id);
        else tier3.push(id);
    }

    return {
        file: fileId,
        exists: true,
        directDependents: node.dependents || [],
        affectedFiles,
        affectedCount: affectedFiles.length,
        impactScope: getImpactScope(affectedFiles.length),
        paths,
        blastRadius: {
            tier1,
            tier2,
            tier3
        }
    };
}

module.exports = {
    analyzeImpact,
    buildReverseAdjacencyList,
    getImpactScope
};


// printing for testing
if (require.main === module) {
    const repoPath = process.argv[2];
    const changedFileId = process.argv[3];

    if (!repoPath || !changedFileId) {
        console.error("Usage: node analyzer/graph/impactAnalyzer.js <repo-path> <changed-file>");
        process.exit(1);
    }

    const graph = buildGraph(repoPath);
    const impact = analyzeImpact(graph, changedFileId);

    console.log(JSON.stringify(impact, null, 2));
}
