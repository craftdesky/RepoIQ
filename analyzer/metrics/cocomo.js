const { scanSourceFiles } = require("../parser/fileScanner");

const COCOMO_MODES = {
    organic: { a: 2.4, b: 1.05, c: 2.5, d: 0.38 },
    semiDetached: { a: 3.0, b: 1.12, c: 2.5, d: 0.35 },
    embedded: { a: 3.6, b: 1.2, c: 2.5, d: 0.32 }
};

function calculateCocomoFromLoc(loc, options = {}) {
    const modeName = options.mode || "organic";
    const mode = COCOMO_MODES[modeName] || COCOMO_MODES.organic;
    const averageMonthlyCost = options.averageMonthlyCost || 0;
    const kloc = loc / 1000;

    if (kloc === 0) {
        return {
            mode: modeName,
            loc,
            kloc: 0,
            effortPersonMonths: 0,
            developmentTimeMonths: 0,
            averageTeamSize: 0,
            estimatedCost: averageMonthlyCost ? 0 : null
        };
    }

    const effort = mode.a * Math.pow(kloc, mode.b);
    const developmentTime = mode.c * Math.pow(effort, mode.d);
    const averageTeamSize = developmentTime === 0 ? 0 : effort / developmentTime;
    const estimatedCost = averageMonthlyCost ? effort * averageMonthlyCost : null;

    return {
        mode: modeName,
        loc,
        kloc: Number(kloc.toFixed(3)),
        effortPersonMonths: Number(effort.toFixed(2)),
        developmentTimeMonths: Number(developmentTime.toFixed(2)),
        averageTeamSize: Number(averageTeamSize.toFixed(2)),
        estimatedCost: estimatedCost === null ? null : Number(estimatedCost.toFixed(2))
    };
}

function calculateRepoCocomo(repoPath, options = {}) {
    const files = scanSourceFiles(repoPath);
    const totalLoc = files.reduce((sum, file) => sum + file.lineCount, 0);

    return {
        summary: calculateCocomoFromLoc(totalLoc, options),
        files: files.map((file) => ({
            file: file.relativePath,
            extension: file.extension,
            lineCount: file.lineCount
        }))
    };
}

module.exports = {
    COCOMO_MODES,
    calculateCocomoFromLoc,
    calculateRepoCocomo
};

if (require.main === module) {
    const repoPath = process.argv[2] || ".";
    const mode = process.argv[3] || "organic";
    console.log(JSON.stringify(calculateRepoCocomo(repoPath, { mode }), null, 2));
}
