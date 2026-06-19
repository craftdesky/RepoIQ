const fs = require("fs");
const path = require("path");

function writeJsonReport(outputDir, fileName, data) {
    const resolvedOutputDir = path.resolve(outputDir);
    const outputPath = path.join(resolvedOutputDir, fileName);

    fs.mkdirSync(resolvedOutputDir, { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

    return outputPath;
}

function writeAnalysisReports(analysis, outputDir = "analysis-output") {
    return {
        graph: writeJsonReport(outputDir, "graph.json", analysis.graph),
        cycles: writeJsonReport(outputDir, "cycles.json", analysis.cycles),
        stats: writeJsonReport(outputDir, "stats.json", analysis.stats),
        summary: writeJsonReport(outputDir, "summary.json", {
            nodeCount: analysis.stats.nodeCount,
            edgeCount: analysis.stats.edgeCount,
            cycleCount: analysis.cycles.length,
            isolatedCount: analysis.stats.isolatedCount
        })
    };
}

module.exports = {
    writeJsonReport,
    writeAnalysisReports
};
