const { buildGraph } = require("./graph/graphBuilder");
const { detectCycles } = require("./graph/cycleDetector");
const { calculateGraphStats } = require("./graph/stats");
const { analyzeImpact } = require("./graph/impactAnalyzer");
const { calculateRepoHalstead } = require("./metrics/halstead");
const { calculateRepoCyclomatic } = require("./metrics/cyclomaticComplexity");
const { calculateRepoCocomo } = require("./metrics/cocomo");
const { calculateRepoCommentDensity } = require("./metrics/commentDensity");

function buildImpactReport(graph) {
    const nodes = typeof graph.getNodes === "function"
        ? graph.getNodes()
        : (graph.nodes || []);

    const impacts = {};
    for (const node of nodes) {
        impacts[node.id] = analyzeImpact(graph, node.id);
    }

    return impacts;
}

function analyzeRepo(repoPath) {
    // --- Graph & structural analysis ---
    const graph = buildGraph(repoPath);
    const graphJson = graph.toJSON();
    const cycles = detectCycles(graph);
    const stats = calculateGraphStats(graph);

    // --- Impact analysis for every file ---
    const impact = buildImpactReport(graph);

    // --- Software engineering metrics ---
    const halstead = calculateRepoHalstead(repoPath);
    const cyclomaticComplexity = calculateRepoCyclomatic(repoPath);
    const cocomo = calculateRepoCocomo(repoPath);
    const commentDensity = calculateRepoCommentDensity(repoPath);

    return {
        graph: graphJson,
        cycles,
        stats,
        impact,
        metrics: {
            halstead,
            cyclomaticComplexity,
            cocomo,
            commentDensity
        }
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
