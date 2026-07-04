/**
 * Technical Debt Calculator
 * 
 * Identifies code structures that increase maintenance costs by evaluating:
 * - Complexity Debt (high CC files)
 * - Coupling Debt (tight inter-module dependencies)
 * - Cycle Debt (circular dependencies)
 * - Documentation Debt (lack of comments)
 * - Maintainability Debt (low MI files)
 */

function calculateComplexityDebt(metrics, graph) {
    try {
        if (!metrics?.cyclomaticComplexity?.files) return 0;

        let debtPoints = 0;
        const files = metrics.cyclomaticComplexity.files;

        for (const file of files) {
            const cc = file.metrics?.summary?.averageComplexity || 0;
            
            if (cc > 15) debtPoints += 20;           // High complexity
            else if (cc > 10) debtPoints += 10;      // Moderate complexity
        }

        // Normalize to [0, 100]
        const totalFiles = graph?.nodes?.length || files.length || 1;
        const normalized = Math.min(100, (debtPoints / totalFiles) * 5);
        
        return Math.round(normalized);
    } catch (error) {
        console.error("[technical-debt] Error calculating complexity debt:", error);
        return 0;
    }
}

function calculateCouplingDebt(metrics) {
    try {
        const couplingDensity = metrics?.couplingDensity?.density || 0;
        
        // Convert to [0, 100]
        let debtScore = couplingDensity * 100;
        
        // Add severity multiplier for high coupling
        if (couplingDensity > 0.75) {
            debtScore = Math.min(100, debtScore * 1.25);
        }
        
        return Math.round(debtScore);
    } catch (error) {
        console.error("[technical-debt] Error calculating coupling debt:", error);
        return 0;
    }
}

function calculateCycleDebt(cycles) {
    try {
        const cycleCount = cycles?.length || 0;
        
        // Each cycle adds 15 points, capped at 100
        const debtScore = Math.min(100, cycleCount * 15);
        
        return Math.round(debtScore);
    } catch (error) {
        console.error("[technical-debt] Error calculating cycle debt:", error);
        return 0;
    }
}

function calculateDocumentationDebt(metrics) {
    try {
        const commentDensity = metrics?.commentDensity?.summary?.averageCommentDensity || 0;
        
        let debtScore = 0;
        if (commentDensity < 0.05) debtScore = 40;      // Critical lack
        else if (commentDensity < 0.10) debtScore = 20; // Low
        else if (commentDensity < 0.15) debtScore = 10; // Moderate
        
        return debtScore;
    } catch (error) {
        console.error("[technical-debt] Error calculating documentation debt:", error);
        return 0;
    }
}

function calculateMaintainabilityDebt(metrics) {
    try {
        const maintainabilityMetrics = metrics?.maintainability;
        if (!maintainabilityMetrics?.summary?.averageMaintainability) return 0;
        
        const avgMI = maintainabilityMetrics.summary.averageMaintainability;
        
        let debtScore = 0;
        if (avgMI < 50) debtScore = 40;      // Unmaintainable
        else if (avgMI < 70) debtScore = 20; // Low maintainability
        
        return debtScore;
    } catch (error) {
        console.error("[technical-debt] Error calculating maintainability debt:", error);
        return 0;
    }
}

function calculatePerFileDebt(file, metrics, graph, cycles) {
    try {
        const ccFile = metrics?.cyclomaticComplexity?.files?.find(f => f.file === file.id);
        const couplingFile = metrics?.couplingDensity?.perFile?.find(f => f.file === file.id);
        const docFile = metrics?.commentDensity?.files?.find(f => f.file === file.id);

        // Complexity factor (0-1)
        const cc = ccFile?.metrics?.summary?.averageComplexity || 0;
        const complexityFactor = Math.min(1, cc / 20);

        // Coupling factor (0-1) - proportion of outgoing external edges
        let couplingFactor = 0;
        if (couplingFile?.outgoingEdges > 0) {
            couplingFactor = couplingFile.outgoingExternalEdges / couplingFile.outgoingEdges;
        }

        // Cycle factor (0-1)
        const inCycle = cycles?.some(c => c.includes?.(file.id)) || false;
        const cycleFactor = inCycle ? 1 : 0;

        // Documentation factor (0-1)
        const docDensity = docFile?.metrics?.commentDensity || 0;
        const docFactor = 1 - Math.min(1, docDensity / 0.15);

        // Combined per-file debt (0-1)
        const fileDebt = (complexityFactor * 0.40) +
                         (couplingFactor * 0.35) +
                         (cycleFactor * 0.15) +
                         (docFactor * 0.10);

        return Math.round(fileDebt * 100);
    } catch (error) {
        console.error("[technical-debt] Error calculating per-file debt:", error);
        return 0;
    }
}

function calculateTechnicalDebt(metrics, graph, cycles) {
    try {
        // Calculate component debts
        const complexityDebt = calculateComplexityDebt(metrics, graph);
        const couplingDebt = calculateCouplingDebt(metrics);
        const cycleDebt = calculateCycleDebt(cycles);
        const documentationDebt = calculateDocumentationDebt(metrics);
        const maintainabilityDebt = calculateMaintainabilityDebt(metrics);

        // Weighted combination
        const weights = {
            complexity: 0.30,
            coupling: 0.25,
            cycles: 0.25,
            documentation: 0.15,
            maintainability: 0.05
        };

        const totalDebt = Math.min(
            100,
            (complexityDebt * weights.complexity) +
            (couplingDebt * weights.coupling) +
            (cycleDebt * weights.cycles) +
            (documentationDebt * weights.documentation) +
            (maintainabilityDebt * weights.maintainability)
        );

        // Calculate per-file debts for hotspots
        const fileDebts = (graph?.nodes || [])
            .map(file => ({
                file: file.id,
                debtScore: calculatePerFileDebt(file, metrics, graph, cycles)
            }))
            .filter(f => f.debtScore > 60)  // Only show hotspots
            .sort((a, b) => b.debtScore - a.debtScore)
            .slice(0, 20);  // Top 20

        // Categorize files by risk
        const allFileDebts = (graph?.nodes || [])
            .map(file => calculatePerFileDebt(file, metrics, graph, cycles));

        const riskDistribution = {
            low: allFileDebts.filter(d => d <= 20).length,
            medium: allFileDebts.filter(d => d > 20 && d <= 40).length,
            high: allFileDebts.filter(d => d > 40 && d <= 60).length,
            critical: allFileDebts.filter(d => d > 60).length
        };

        // Determine risk category
        let riskCategory;
        if (totalDebt <= 20) riskCategory = "Low Risk";
        else if (totalDebt <= 40) riskCategory = "Medium Risk";
        else if (totalDebt <= 60) riskCategory = "High Risk";
        else riskCategory = "Critical Risk";

        return {
            summary: {
                technicalDebtScore: Math.round(totalDebt),
                riskCategory,
                totalFiles: graph?.nodes?.length || 0
            },
            breakdown: {
                complexity: { score: complexityDebt, weight: weights.complexity },
                coupling: { score: couplingDebt, weight: weights.coupling },
                cycles: { score: cycleDebt, weight: weights.cycles },
                documentation: { score: documentationDebt, weight: weights.documentation },
                maintainability: { score: maintainabilityDebt, weight: weights.maintainability }
            },
            debtHotspots: fileDebts,
            riskDistribution,
            refactoringCandidates: fileDebts.slice(0, 10).map((f, idx) => ({
                rank: idx + 1,
                file: f.file,
                debtScore: f.debtScore,
                priority: f.debtScore > 80 ? "Critical" : f.debtScore > 60 ? "High" : "Medium"
            }))
        };
    } catch (error) {
        console.error("[technical-debt] Error calculating technical debt:", error);
        return {
            summary: {
                technicalDebtScore: 0,
                riskCategory: "Unknown",
                totalFiles: 0
            },
            breakdown: {
                complexity: { score: 0, weight: 0.30 },
                coupling: { score: 0, weight: 0.25 },
                cycles: { score: 0, weight: 0.25 },
                documentation: { score: 0, weight: 0.15 },
                maintainability: { score: 0, weight: 0.05 }
            },
            debtHotspots: [],
            riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
            refactoringCandidates: []
        };
    }
}

module.exports = {
    calculateTechnicalDebt,
    calculatePerFileDebt
};
