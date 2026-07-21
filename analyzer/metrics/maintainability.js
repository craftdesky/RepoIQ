/**
 * Using Microsoft's Maintainability Index formula to calculate a score (0-100) representing long term maintinability of code
 * 
 * Formula:
 * MI = 171 - 5.2 * ln(HalsteadVolume)
 *      - 0.23 * CyclomaticComplexity
 *      - 16.2 * ln(LinesOfCode)
 *      + 50 * sqrt(2.46 * CommentDensity)
 */

function calculateMaintainabilityIndex(halsteadVolume, cyclomaticComplexity, linesOfCode, commentDensity) {
    const volume = Math.max(1, halsteadVolume || 0);
    const loc = Math.max(1, linesOfCode || 0);
    const cc = Math.max(1, cyclomaticComplexity || 1);
    const cd = Math.max(0, Math.min(1, commentDensity || 0));
    
    const mi = 171 - (5.2 * Math.log(volume)) - (0.23 * cc) - (16.2 * Math.log(loc)) + (50 * Math.sqrt(2.46 * cd));
    
    return Math.max(0, Math.min(100, mi));
}

function getMaintainabilityCategory(score) {
    if (score >= 90) return { category: "Highly Maintainable", level: "excellent", color: "#10b981" };
    if (score >= 70) return { category: "Moderately Maintainable", level: "good", color: "#3b82f6" };
    if (score >= 50) return { category: "Low Maintainability", level: "concerning", color: "#f59e0b" };
    return { category: "Unmaintainable", level: "critical", color: "#ef4444" };
}

function calculateRepoMaintainability(repoPath, metrics, graphData) {
    try {
        if (!metrics || !metrics.halstead || !metrics.cyclomaticComplexity) {
            return {
                summary: {
                    averageMaintainability: 0,
                    category: "Unknown",
                    totalFiles: 0,
                    distribution: {
                        excellent: 0,
                        good: 0,
                        concerning: 0,
                        critical: 0
                    }
                },
                files: []
            };
        }

        const files = graphData?.nodes || [];
        const fileScores = [];

        // MI for each file
        for (const file of files) {
            const halsteadFile = metrics.halstead.files?.find(f => f.file === file.id);
            const ccFile = metrics.cyclomaticComplexity.files?.find(f => f.file === file.id);
            const commentFile = metrics.commentDensity?.files?.find(f => f.file === file.id);

            const halsteadVolume = halsteadFile?.metrics?.volume || 0;
            const avgCC = ccFile?.metrics?.summary?.averageComplexity || 1;
            const loc = file.lineCount || 0;
            const commentDensity = commentFile?.metrics?.commentDensity || 0;

            const mi = calculateMaintainabilityIndex(halsteadVolume, avgCC, loc, commentDensity);
            const categoryInfo = getMaintainabilityCategory(mi);

            fileScores.push({
                file: file.id,
                maintainabilityIndex: Math.round(mi * 10) / 10,
                ...categoryInfo,
                metrics: {
                    halsteadVolume: Math.round(halsteadVolume),
                    cyclomaticComplexity: Math.round(avgCC * 10) / 10,
                    linesOfCode: loc,
                    commentDensity: Math.round(commentDensity * 1000) / 1000
                }
            });
        }

        // Repository average and distribution
        if (fileScores.length === 0) {
            return {
                summary: {
                    averageMaintainability: 0,
                    category: "Unknown",
                    totalFiles: 0,
                    distribution: {
                        excellent: 0,
                        good: 0,
                        concerning: 0,
                        critical: 0
                    }
                },
                files: []
            };
        }

        const avgMI = fileScores.reduce((sum, f) => sum + f.maintainabilityIndex, 0) / fileScores.length;
        const categoryInfo = getMaintainabilityCategory(avgMI);

        const distribution = {
            excellent: fileScores.filter(f => f.level === "excellent").length,
            good: fileScores.filter(f => f.level === "good").length,
            concerning: fileScores.filter(f => f.level === "concerning").length,
            critical: fileScores.filter(f => f.level === "critical").length
        };

        // Sort by score (lowest first - needs most work)
        const sortedFiles = [...fileScores].sort((a, b) => a.maintainabilityIndex - b.maintainabilityIndex);

        return {
            summary: {
                averageMaintainability: Math.round(avgMI * 10) / 10,
                ...categoryInfo,
                totalFiles: fileScores.length,
                distribution,
                recommendedRefactoring: sortedFiles.slice(0, 10) // Top 10 worst files
            },
            files: sortedFiles
        };
    }
    catch (error) {
        console.error("[maintainability] Error calculating maintainability:", error);
        return {
            summary: {
                averageMaintainability: 0,
                category: "Error",
                level: "unknown",
                totalFiles: 0,
                distribution: { excellent: 0, good: 0, concerning: 0, critical: 0 }
            },
            files: []
        };
    }
}

module.exports = {
    calculateRepoMaintainability,
    calculateMaintainabilityIndex,
    getMaintainabilityCategory
};
