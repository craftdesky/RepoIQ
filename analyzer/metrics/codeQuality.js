/**
 * Code Quality Score Calculator
 * 
 * Generates an aggregate quality score based on five dimensions:
 * - Complexity (lower is better)
 * - Coupling (lower is better)
 * - Documentation (higher is better)
 * - Architecture (fewer cycles is better)
 * - Consistency (low variance is better)
 */

function normalizeScore(value, min, max, inverse = false) {
    // Clamp value between min and max
    const clamped = Math.max(min, Math.min(max, value));
    let normalized = (clamped - min) / (max - min);
    
    // Invert if lower is better (e.g., complexity)
    if (inverse) normalized = 1 - normalized;
    
    return Math.round(normalized * 100);
}

function getQualityRating(score) {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
}

function getQualityGrade(score) {
    if (score >= 80) return "A";
    if (score >= 60) return "B";
    if (score >= 40) return "C";
    if (score >= 20) return "D";
    return "F";
}

function identifyStrengths(breakdown) {
    const strengths = [];
    if (breakdown.complexity.score > 70) strengths.push("Low cyclomatic complexity");
    if (breakdown.coupling.score > 70) strengths.push("Good modularity");
    if (breakdown.documentation.score > 70) strengths.push("Well-documented codebase");
    if (breakdown.architecture.score > 70) strengths.push("Clean architecture");
    if (breakdown.consistency.score > 70) strengths.push("Consistent code patterns");
    return strengths;
}

function identifyWeaknesses(breakdown) {
    const weaknesses = [];
    if (breakdown.complexity.score < 40) weaknesses.push("High code complexity - refactor complex functions");
    if (breakdown.coupling.score < 40) weaknesses.push("High coupling - reduce interdependencies");
    if (breakdown.documentation.score < 40) weaknesses.push("Low documentation - add comments and docstrings");
    if (breakdown.architecture.score < 40) weaknesses.push("Architectural cycles - break circular dependencies");
    if (breakdown.consistency.score < 40) weaknesses.push("Inconsistent patterns - standardize code structure");
    return weaknesses;
}

function calculateMetricsVariance(metrics) {
    try {
        if (!metrics || !metrics.cyclomaticComplexity?.files) return 50;

        const values = metrics.cyclomaticComplexity.files
            .map(f => f.metrics?.summary?.averageComplexity || 0)
            .filter(v => v > 0);

        if (values.length < 2) return 50;

        const mean = values.reduce((a, b) => a + b) / values.length;
        const variance = values.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        const coeffVar = (stdDev / (mean || 1)) * 100;

        // Normalize coefficient of variation to [0, 100]
        // High variance (>100%) gets low score
        const normalized = Math.max(0, 100 - Math.min(coeffVar, 100));
        return Math.round(normalized);
    } catch (error) {
        console.error("[code-quality] Error calculating variance:", error);
        return 50;
    }
}

function calculateCodeQualityScore(metrics, graph, cycles) {
    try {
        // Extract metrics with safe defaults
        const avgCC = metrics?.cyclomaticComplexity?.summary?.averageComplexity || 5;
        const couplingDensity = metrics?.couplingDensity?.density || 0.5;
        const commentDensity = metrics?.commentDensity?.summary?.averageCommentDensity || 0.1;
        const cycleCount = cycles?.length || 0;

        // 1. COMPLEXITY SCORE (lower is better)
        // Benchmark: CC average between 2-8 is good
        const complexityScore = normalizeScore(avgCC, 1, 10, true);

        // 2. COUPLING SCORE (lower is better)
        // Benchmark: density < 0.4 is modular
        const couplingScore = normalizeScore(couplingDensity, 0, 1, true);

        // 3. DOCUMENTATION SCORE (higher is better)
        // Benchmark: > 15% comments is well-documented
        const docScore = normalizeScore(commentDensity, 0, 0.3, false);

        // 4. ARCHITECTURE SCORE (fewer cycles is better)
        const cycleImpact = cycleCount > 0 ? Math.min(100, cycleCount * 10) : 0;
        const architectureScore = 100 - cycleImpact;

        // 5. CONSISTENCY SCORE (low variance is better)
        const consistencyScore = calculateMetricsVariance(metrics);

        // Weighted average
        const weights = {
            complexity: 0.25,
            coupling: 0.25,
            documentation: 0.20,
            architecture: 0.20,
            consistency: 0.10
        };

        const qualityScore =
            (complexityScore * weights.complexity) +
            (couplingScore * weights.coupling) +
            (docScore * weights.documentation) +
            (architectureScore * weights.architecture) +
            (consistencyScore * weights.consistency);

        const breakdown = {
            complexity: { score: complexityScore, weight: weights.complexity },
            coupling: { score: couplingScore, weight: weights.coupling },
            documentation: { score: docScore, weight: weights.documentation },
            architecture: { score: architectureScore, weight: weights.architecture },
            consistency: { score: consistencyScore, weight: weights.consistency }
        };

        return {
            summary: {
                overallQualityScore: Math.round(qualityScore),
                rating: getQualityRating(qualityScore),
                grade: getQualityGrade(qualityScore)
            },
            breakdown,
            strengths: identifyStrengths(breakdown),
            weaknesses: identifyWeaknesses(breakdown)
        };
    } catch (error) {
        console.error("[code-quality] Error calculating code quality:", error);
        return {
            summary: {
                overallQualityScore: 0,
                rating: "Unknown",
                grade: "F"
            },
            breakdown: {
                complexity: { score: 0, weight: 0.25 },
                coupling: { score: 0, weight: 0.25 },
                documentation: { score: 0, weight: 0.20 },
                architecture: { score: 0, weight: 0.20 },
                consistency: { score: 0, weight: 0.10 }
            },
            strengths: [],
            weaknesses: ["Unable to calculate code quality metrics"]
        };
    }
}

module.exports = {
    calculateCodeQualityScore
};
