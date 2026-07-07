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

/**
 * Extract key project metadata files for AI context.
 */
function extractProjectMetadata(repoPath) {
    const metadata = {};

    // Read README
    const readmeNames = ["README.md", "readme.md", "README.markdown", "README.txt", "README"];
    for (const name of readmeNames) {
        const readmePath = path.join(repoPath, name);
        if (fs.existsSync(readmePath)) {
            try {
                const content = fs.readFileSync(readmePath, "utf-8");
                metadata.readme = content.slice(0, 8000); // cap at 8k chars
                metadata.readmeFile = name;
            }
            catch (error) { /* ignore read errors */ }
            break;
        }
    }

    // Read package.json
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
        catch (error) { /* ignore parse errors */ }
    }

    return metadata;
}

function analyzeRepo(repoPath, options = {}) {
    // --- Project metadata for AI features ---
    const projectMetadata = extractProjectMetadata(repoPath);

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

    // --- Coupling & Architectural Health ---
    const couplingDensity = calculateCouplingDensity(graph);
    const architecturalHealth = calculateArchitecturalHealth({
        numCycles: cycles.length,
        couplingDensity: couplingDensity.density,
        CCavg: cyclomaticComplexity.summary ? cyclomaticComplexity.summary.averageComplexity : 0
    });

    // --- Hotspots (Feature 7)
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

    // --- Critical connectors (articulation points, bridges, centrality)
    const connectors = calculateConnectors(graph);

    // --- External Dependencies (Feature 14)
    const externalDependencies = analyzeExternalDependencies(repoPath, graphJson);

    // --- Folder-Level Aggregation (Feature 9.3)
    const folderGraph = aggregateFolderGraph(graphJson);

    // --- Advanced Metrics (Phase 3) ---
    // Build metrics object for new calculators
    const metricsForCalculation = {
        halstead,
        cyclomaticComplexity,
        cocomo,
        commentDensity,
        couplingDensity,
        architecturalHealth
    };

    // Maintainability Index (Feature 13.3)
    const maintainability = calculateRepoMaintainability(repoPath, metricsForCalculation, graphJson);
    metricsForCalculation.maintainability = maintainability;

    // Code Quality Score (Feature 13.5)
    const codeQuality = calculateCodeQualityScore(metricsForCalculation, graphJson, cycles);

    // Technical Debt Indicators (Feature 13.6)
    const technicalDebt = calculateTechnicalDebt(metricsForCalculation, graphJson, cycles);

    // Repository Benchmarking (Feature 13.7)
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
            // Phase 3 Advanced Metrics
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


// printing for testing
if (require.main === module) {
    const repoPath = process.argv[2] || ".";
    const result = analyzeRepo(repoPath);
    console.log(JSON.stringify(result, null, 2));
}
