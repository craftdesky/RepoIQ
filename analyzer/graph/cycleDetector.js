const { buildGraph } = require("./graphBuilder");
const { getNodes } = require("./graphUtils");

function normalizeCycle(cycle) {
    const cycleWithoutClosingNode = cycle.slice(0, -1);
    let smallestIndex = 0;

    for (let index = 1; index < cycleWithoutClosingNode.length; index += 1) {
        if (cycleWithoutClosingNode[index] < cycleWithoutClosingNode[smallestIndex]) {
            smallestIndex = index;
        }
    }

    const rotated = [
        ...cycleWithoutClosingNode.slice(smallestIndex),
        ...cycleWithoutClosingNode.slice(0, smallestIndex)
    ];

    return [...rotated, rotated[0]];
}

function getCycleKey(cycle) {
    return normalizeCycle(cycle).join("->");
}

const LOW_SEVERITY_THRESHOLD = 5;
const MED_SEVERITY_THRESHOLD = 10;

function getSeverity(cycleLength) {
    if (cycleLength <= LOW_SEVERITY_THRESHOLD) return "low";
    if (cycleLength <= MED_SEVERITY_THRESHOLD) return "medium";
    return "high";
}

function detectCycles(graph) {
    const nodes = getNodes(graph);
    const adjacencyList = new Map();

    for (const node of nodes) {
        adjacencyList.set(node.id, node.dependencies || []);
    }

    const visited = new Set();
    const inStack = new Set();
    const stack = [];
    const cycleKeys = new Set();
    const cycles = [];

    function visit(nodeId) {
        visited.add(nodeId);
        inStack.add(nodeId);
        stack.push(nodeId);

        const dependencies = adjacencyList.get(nodeId) || [];

        for (const dependencyId of dependencies) {
            if (!adjacencyList.has(dependencyId)) {
                continue;
            }

            if (!visited.has(dependencyId)) {
                visit(dependencyId);
                continue;
            }

            if (inStack.has(dependencyId)) {
                const startIndex = stack.indexOf(dependencyId);
                const cyclePath = [...stack.slice(startIndex), dependencyId];
                const cycleKey = getCycleKey(cyclePath);

                if (!cycleKeys.has(cycleKey)) {
                    const normalizedPath = normalizeCycle(cyclePath);
                    const affectedModules = normalizedPath.slice(0, -1);

                    cycleKeys.add(cycleKey);
                    cycles.push({
                        path: normalizedPath,
                        affectedModules,
                        length: affectedModules.length,
                        severity: getSeverity(affectedModules.length)
                    });
                }
            }
        }

        stack.pop();
        inStack.delete(nodeId);
    }

    for (const node of nodes) {
        if (!visited.has(node.id)) {
            visit(node.id);
        }
    }

    return cycles;
}

module.exports = {
    detectCycles,
    normalizeCycle,
    getSeverity
};


// printing for testing
if (require.main === module) {
    const repoPath = process.argv[2] || ".";
    const graph = buildGraph(repoPath);
    const cycles = detectCycles(graph);

    console.log(JSON.stringify({
        cycleCount: cycles.length,
        cycles
    }, null, 2));
}
