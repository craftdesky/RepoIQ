const { buildGraph } = require("./graph/graphBuilder");
const { detectCycles } = require("./graph/cycleDetector");
const { calculateGraphStats } = require("./graph/stats");

function analyzeRepo(repoPath) {
    const graph = buildGraph(repoPath);
    const graphJson = graph.toJSON();
    const cycles = detectCycles(graph);
    const stats = calculateGraphStats(graph);

    return {
        graph: graphJson,
        cycles,
        stats
    };
}

module.exports = {
    analyzeRepo
};


// printing for testing
if (require.main === module) {
    const repoPath = process.argv[2] || ".";
    const result = analyzeRepo(repoPath);
    console.log(JSON.stringify(result, null, 2));
}
