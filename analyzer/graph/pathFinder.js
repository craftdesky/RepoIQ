// find dependency paths between files/modules.

const { buildGraph } = require("./graphBuilder");
const { getNodes, normalizeId } = require("./graphUtils");

function buildAdjacencyList(graph) {
    const adjacencyList = new Map();

    for (const node of getNodes(graph)) {
        adjacencyList.set(node.id, node.dependencies || []);
    }

    return adjacencyList;
}

function findShortestPath(graph, startId, targetId) {
    const adjacencyList = buildAdjacencyList(graph);

    if (!adjacencyList.has(startId) || !adjacencyList.has(targetId)) {
        return null;
    }

    const queue = [[startId]];
    const visited = new Set([startId]);

    while (queue.length > 0) {
        const path = queue.shift();
        const currentId = path[path.length - 1];

        if (currentId === targetId) {
            return {
                path,
                length: path.length - 1
            };
        }

        for (const dependencyId of adjacencyList.get(currentId) || []) {
            if (visited.has(dependencyId)) {
                continue;
            }

            visited.add(dependencyId);
            queue.push([...path, dependencyId]);
        }
    }

    return null;
}

function findAllPaths(graph, startId, targetId, options = {}) {
    const adjacencyList = buildAdjacencyList(graph);
    const maxDepth = options.maxDepth || 20;
    const maxPaths = options.maxPaths || 100;
    const paths = [];

    if (!adjacencyList.has(startId) || !adjacencyList.has(targetId)) {
        return paths;
    }

    function visit(currentId, currentPath, seen) {
        if (paths.length >= maxPaths) {
            return;
        }

        if (currentPath.length - 1 > maxDepth) {
            return;
        }

        if (currentId === targetId) {
            paths.push({
                path: [...currentPath],
                length: currentPath.length - 1
            });
            return;
        }

        for (const dependencyId of adjacencyList.get(currentId) || []) {
            if (seen.has(dependencyId)) {
                continue;
            }

            seen.add(dependencyId);
            currentPath.push(dependencyId);
            visit(dependencyId, currentPath, seen);
            currentPath.pop();
            seen.delete(dependencyId);
        }
    }

    visit(startId, [startId], new Set([startId]));

    return paths;
}

function findDependencyPaths(graph, startId, targetId, options = {}) {
    const allPaths = findAllPaths(graph, startId, targetId, options);

    return {
        from: startId,
        to: targetId,
        pathCount: allPaths.length,
        shortestPath: findShortestPath(graph, startId, targetId),
        paths: allPaths
    };
}

module.exports = {
    buildAdjacencyList,
    findShortestPath,
    findAllPaths,
    findDependencyPaths
};


// printing for testing
if (require.main === module) {
    const repoPath = process.argv[2];
    const startId = process.argv[3];
    const targetId = process.argv[4];

    if (!repoPath || !startId || !targetId) {
        console.error("Usage: node analyzer/graph/pathFinder.js <repo-path> <from-file> <to-file>");
        process.exit(1);
    }

    const graph = buildGraph(repoPath);
    const result = findDependencyPaths(graph, normalizeId(startId), normalizeId(targetId));

    console.log(JSON.stringify(result, null, 2));
}
