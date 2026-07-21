const fs = require("fs");
const path = require("path");
const { buildGraph } = require("./graph/graphBuilder");
const { detectCycles } = require("./graph/cycleDetector");
const { calculateGraphStats } = require("./graph/stats");
const { analyzeImpact } = require("./graph/impactAnalyzer");
const { calculateRepoHalstead } = require("./metrics/halstead");
const { calculateRepoCyclomatic } = require("./metrics/cyclomaticComplexity");
const { calculateRepoCocomo } = require("./metrics/cocomo");
const { calculateRepoCommentDensity } = require("./metrics/commentDensity");
const { calculateCouplingDensity } = require("./metrics/couplingDensity");
const { calculateArchitecturalHealth } = require("./metrics/architecturalHealth");
const { calculateHotspots } = require("./metrics/hotspots");
const { calculateConnectors } = require("./graph/connectors");
const { analyzeExternalDependencies } = require("./metrics/externalDependencyAnalyzer");
const { aggregateFolderGraph } = require("./graph/folderAggregator");
const { calculateRepoMaintainability } = require("./metrics/maintainability");
const { calculateCodeQualityScore } = require("./metrics/codeQuality");
const { calculateTechnicalDebt } = require("./metrics/technicalDebt");
const { calculateBenchmarkReport } = require("./metrics/benchmarking");

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

// project metadata for AI features
function extractProjectMetadata(repoPath) {
    const metadata = {};

    const readmeNames = ["README.md", "readme.md", "README.markdown", "README.txt", "README"];
    for (const name of readmeNames) {
        const readmePath = path.join(repoPath, name);
        if (fs.existsSync(readmePath)) {
            try {
                const content = fs.readFileSync(readmePath, "utf-8");
                metadata.readme = content.slice(0, 8000); // cap at 8k chars
                metadata.readmeFile = name;
            }
            catch (error) { 
                // ignore
            }
            break;
        }
    }

    const pkgPath = path.join(repoPath, "package.json");
    if (fs.existsSync(pkgPath)) {
        try {
            const raw = fs.readFileSync(pkgPath, "utf-8");
            const pkg = JSON.parse(raw);
            metadata.packageJson = {
                name: pkg.name,
                description: pkg.description,
                version: pkg.version,
                dependencies: pkg.dependencies ? Object.keys(pkg.dependencies) : [],
                devDependencies: pkg.devDependencies ? Object.keys(pkg.devDependencies) : [],
                scripts: pkg.scripts ? Object.keys(pkg.scripts) : []
            };
        } 
        catch (error) {
            // ignore
        }
    }

    return metadata;
}

function analyzeRepo(repoPath, options = {}) {
    const projectMetadata = extractProjectMetadata(repoPath);

    const graph = buildGraph(repoPath);
    const graphJson = graph.toJSON();
    const cycles = detectCycles(graph);
    const stats = calculateGraphStats(graph);

    const impact = buildImpactReport(graph);

    const halstead = calculateRepoHalstead(repoPath);
    const cyclomaticComplexity = calculateRepoCyclomatic(repoPath);
    const cocomo = calculateRepoCocomo(repoPath);
    const commentDensity = calculateRepoCommentDensity(repoPath);

    const couplingDensity = calculateCouplingDensity(graph);
    const architecturalHealth = calculateArchitecturalHealth({
        numCycles: cycles.length,
        couplingDensity: couplingDensity.density,
        CCavg: cyclomaticComplexity.summary ? cyclomaticComplexity.summary.averageComplexity : 0
    });

    const hotspotConfig = options.hotspotConfig || {};
    const hotspots = calculateHotspots(graph, {
        impact,
        cyclomaticComplexity,
        cycles
    }, {
        weights: hotspotConfig.weights,
        thresholds: hotspotConfig.thresholds,
        topN: hotspotConfig.topN
    });

    const connectors = calculateConnectors(graph);

    const externalDependencies = analyzeExternalDependencies(repoPath, graphJson);

    const folderGraph = aggregateFolderGraph(graphJson);

    // metrics object for new calculators
    const metricsForCalculation = {
        halstead,
        cyclomaticComplexity,
        cocomo,
        commentDensity,
        couplingDensity,
        architecturalHealth
    };

    const maintainability = calculateRepoMaintainability(repoPath, metricsForCalculation, graphJson);
    metricsForCalculation.maintainability = maintainability;

    const codeQuality = calculateCodeQualityScore(metricsForCalculation, graphJson, cycles);

    const technicalDebt = calculateTechnicalDebt(metricsForCalculation, graphJson, cycles);

    const benchmarking = calculateBenchmarkReport(metricsForCalculation, graphJson, cycles);

    return {
        graph: graphJson,
        cycles,
        stats,
        impact,
        folderGraph,
        projectMetadata,
        metrics: {
            halstead,
            cyclomaticComplexity,
            cocomo,
            commentDensity,
            couplingDensity,
            architecturalHealth,
            hotspots,
            hotspotsByFolder: hotspots.folders,
            connectors,
            connectorsByFolder: null,
            externalDependencies,
            maintainability,
            codeQuality,
            technicalDebt,
            benchmarking
        }
    };
}

module.exports = {
    analyzeRepo
};
