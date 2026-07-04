/**
 * Repository Benchmarking Calculator
 * 
 * Compares repository metrics against industry-standard thresholds and
 * provides deviation analysis and maturity assessment.
 */

const INDUSTRY_BENCHMARKS = {
    cyclomaticComplexity: {
        excellent: { max: 5 },
        good: { max: 10 },
        acceptable: { max: 15 },
        concerning: { max: 20 },
        critical: { min: 20 }
    },
    couplingDensity: {
        excellent: { max: 0.25 },
        good: { max: 0.40 },
        acceptable: { max: 0.60 },
        concerning: { max: 0.80 },
        critical: { min: 0.80 }
    },
    commentDensity: {
        excellent: { min: 0.25 },
        good: { min: 0.15 },
        acceptable: { min: 0.10 },
        concerning: { min: 0.05 },
        critical: { min: 0 }
    },
    cycles: {
        excellent: 0,
        good: { max: 2 },
        acceptable: { max: 5 },
        concerning: { max: 8 },
        critical: { min: 9 }
    },
    maintainability: {
        excellent: { min: 90 },
        good: { min: 70 },
        acceptable: { min: 50 },
        concerning: { min: 30 },
        critical: { min: 0 }
    }
};

function compareToBenchmark(value, benchmarks) {
    if (!benchmarks) return { status: "unknown", benchmark: null };
    
    for (const [level, range] of Object.entries(benchmarks)) {
        if (range.min !== undefined && value < range.min) continue;
        if (range.max !== undefined && value > range.max) continue;
        return { status: level, benchmark: range };
    }
    
    return { status: "critical", benchmark: null };
}

function getDeviation(value, metricName) {
    const benchmarks = INDUSTRY_BENCHMARKS[metricName];
    if (!benchmarks) return 0;

    // For metrics where lower is better (complexity, coupling)
    if (["cyclomaticComplexity", "couplingDensity"].includes(metricName)) {
        const goodBench = benchmarks.good;
        const goodThreshold = goodBench.max || 1;
        return Math.round(((value - goodThreshold) / goodThreshold) * 100);
    }

    // For metrics where higher is better (comments, maintainability)
    const goodBench = benchmarks.good;
    const goodThreshold = goodBench.min || 1;
    return Math.round(((goodThreshold - value) / goodThreshold) * 100);
}

function getCycleBenchmark(cycleCount) {
    const benchmarks = INDUSTRY_BENCHMARKS.cycles;
    
    if (cycleCount === 0) return { status: "excellent", benchmark: { max: 0 } };
    if (cycleCount <= 2) return { status: "good", benchmark: benchmarks.good };
    if (cycleCount <= 5) return { status: "acceptable", benchmark: benchmarks.acceptable };
    if (cycleCount <= 8) return { status: "concerning", benchmark: benchmarks.concerning };
    return { status: "critical", benchmark: null };
}

function generateComplexityAssessment(avgCC) {
    if (avgCC < 5) return "Simple";
    if (avgCC < 10) return "Moderate";
    if (avgCC < 15) return "Complex";
    return "Highly Complex";
}

function generateMaintainabilityAssessment(avgMI) {
    if (avgMI >= 80) return "High Maintainability";
    if (avgMI >= 70) return "Good Maintainability";
    if (avgMI >= 50) return "Fair Maintainability";
    return "Low Maintainability";
}

function generateEngineeringMaturityLevel(passRate) {
    if (passRate >= 0.90) return { level: 5, status: "Mature", description: "Exemplary practices" };
    if (passRate >= 0.75) return { level: 4, status: "Proficient", description: "Well-managed" };
    if (passRate >= 0.60) return { level: 3, status: "Developing", description: "Improving" };
    if (passRate >= 0.40) return { level: 2, status: "Initial", description: "Inconsistent" };
    return { level: 1, status: "Chaotic", description: "Significant issues" };
}

function calculateBenchmarkReport(allMetrics, graph, cycles) {
    try {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                passedBenchmarks: 0,
                failedBenchmarks: 0,
                totalBenchmarks: 0,
                passRate: 0
            },
            metrics: {}
        };

        // 1. Cyclomatic Complexity Benchmark
        const avgCC = allMetrics?.cyclomaticComplexity?.summary?.averageComplexity || 0;
        const ccBench = compareToBenchmark(avgCC, INDUSTRY_BENCHMARKS.cyclomaticComplexity);
        report.metrics.cyclomaticComplexity = {
            value: Math.round(avgCC * 100) / 100,
            benchmark: ccBench.status,
            deviation: getDeviation(avgCC, "cyclomaticComplexity"),
            recommendation: ccBench.status === "excellent" || ccBench.status === "good"
                ? "Maintain current complexity levels"
                : "Focus on reducing function complexity through refactoring"
        };

        // 2. Coupling Density Benchmark
        const coupling = allMetrics?.couplingDensity?.density || 0;
        const couplingBench = compareToBenchmark(coupling, INDUSTRY_BENCHMARKS.couplingDensity);
        report.metrics.couplingDensity = {
            value: Math.round(coupling * 10000) / 10000,
            benchmark: couplingBench.status,
            deviation: getDeviation(coupling, "couplingDensity"),
            recommendation: couplingBench.status === "excellent" || couplingBench.status === "good"
                ? "Architecture is well-modularized"
                : "Refactor to reduce module interdependencies"
        };

        // 3. Comment Density Benchmark
        const comments = allMetrics?.commentDensity?.summary?.averageCommentDensity || 0;
        const commentBench = compareToBenchmark(comments, INDUSTRY_BENCHMARKS.commentDensity);
        report.metrics.commentDensity = {
            value: Math.round(comments * 10000) / 10000,
            benchmark: commentBench.status,
            deviation: getDeviation(comments, "commentDensity"),
            recommendation: commentBench.status === "excellent" || commentBench.status === "good"
                ? "Documentation is thorough"
                : "Add more code comments and documentation"
        };

        // 4. Cycle Count Benchmark
        const cycleCount = cycles?.length || 0;
        const cycleBench = getCycleBenchmark(cycleCount);
        report.metrics.cycles = {
            value: cycleCount,
            benchmark: cycleBench.status,
            deviation: cycleCount === 0 ? 0 : -Math.min(100, cycleCount * 10),
            recommendation: cycleCount === 0
                ? "No architectural cycles detected"
                : `${cycleCount} cycles found - refactor to break dependencies`
        };

        // 5. Maintainability Benchmark
        const avgMI = allMetrics?.maintainability?.summary?.averageMaintainability || 0;
        const miBench = compareToBenchmark(avgMI, INDUSTRY_BENCHMARKS.maintainability);
        report.metrics.maintainability = {
            value: Math.round(avgMI * 10) / 10,
            benchmark: miBench.status,
            deviation: getDeviation(avgMI, "maintainability"),
            recommendation: miBench.status === "excellent" || miBench.status === "good"
                ? "Codebase is maintainable"
                : "Implement refactoring improvements to increase maintainability"
        };

        // Count benchmark results
        const allBenchmarks = Object.values(report.metrics);
        report.summary.totalBenchmarks = allBenchmarks.length;
        report.summary.passedBenchmarks = allBenchmarks.filter(b =>
            ["excellent", "good", "acceptable"].includes(b.benchmark)
        ).length;
        report.summary.failedBenchmarks = report.summary.totalBenchmarks - report.summary.passedBenchmarks;
        report.summary.passRate = Math.round((report.summary.passedBenchmarks / report.summary.totalBenchmarks) * 100);

        // Assessments
        report.assessments = {
            complexity: generateComplexityAssessment(avgCC),
            maintainability: generateMaintainabilityAssessment(avgMI),
            maturity: generateEngineeringMaturityLevel(report.summary.passedBenchmarks / report.summary.totalBenchmarks)
        };

        // Generate prioritized recommendations
        report.recommendations = generateRecommendations(report, avgCC, coupling, comments, cycleCount, avgMI);

        return report;
    } catch (error) {
        console.error("[benchmarking] Error calculating benchmark report:", error);
        return {
            timestamp: new Date().toISOString(),
            summary: {
                passedBenchmarks: 0,
                failedBenchmarks: 0,
                totalBenchmarks: 0,
                passRate: 0
            },
            metrics: {},
            assessments: { complexity: "Unknown", maintainability: "Unknown", maturity: {} },
            recommendations: []
        };
    }
}

function generateRecommendations(report, avgCC, coupling, comments, cycleCount, avgMI) {
    const recommendations = [];

    // Priority 1: Critical cycles
    if (cycleCount > 0) {
        recommendations.push({
            priority: "Critical",
            category: "Architecture",
            action: "Eliminate circular dependencies",
            details: `${cycleCount} circular dependency cycle(s) detected`,
            impact: "Cycles create unpredictable behavior and increase risk"
        });
    }

    // Priority 2: High complexity
    if (report.metrics.cyclomaticComplexity.benchmark === "critical" || report.metrics.cyclomaticComplexity.benchmark === "concerning") {
        recommendations.push({
            priority: "High",
            category: "Complexity",
            action: "Reduce cyclomatic complexity",
            details: `Current: ${avgCC.toFixed(2)}, Target: <10`,
            impact: "Reduces testing effort and improves code readability"
        });
    }

    // Priority 3: High coupling
    if (report.metrics.couplingDensity.benchmark === "critical" || report.metrics.couplingDensity.benchmark === "concerning") {
        recommendations.push({
            priority: "High",
            category: "Modularity",
            action: "Reduce module coupling",
            details: `Current: ${(coupling * 100).toFixed(1)}%, Target: <40%`,
            impact: "Improves modularity and reduces change ripple effects"
        });
    }

    // Priority 4: Low documentation
    if (report.metrics.commentDensity.benchmark === "critical" || report.metrics.commentDensity.benchmark === "concerning") {
        recommendations.push({
            priority: "Medium",
            category: "Documentation",
            action: "Improve code documentation",
            details: `Current: ${(comments * 100).toFixed(1)}%, Target: >15%`,
            impact: "Reduces onboarding time and maintenance costs"
        });
    }

    // Priority 5: Low maintainability
    if (report.metrics.maintainability.benchmark === "critical" || report.metrics.maintainability.benchmark === "concerning") {
        recommendations.push({
            priority: "High",
            category: "Maintainability",
            action: "Improve overall maintainability",
            details: `Current MI: ${avgMI.toFixed(1)}, Target: >70`,
            impact: "Lowers long-term maintenance costs"
        });
    }

    return recommendations;
}

module.exports = {
    calculateBenchmarkReport,
    INDUSTRY_BENCHMARKS,
    generateComplexityAssessment,
    generateMaintainabilityAssessment,
    generateEngineeringMaturityLevel
};
