const traverse = require("@babel/traverse").default;
const { scanSourceFiles } = require("../parser/fileScanner");
const { parseFile } = require("../parser/fileParser");

function addToken(collection, token) {
    if (!token) return;
    collection.total += 1;
    collection.unique.add(String(token));
}

function createTokenCollection() {
    return {
        total: 0,
        unique: new Set()
    };
}

function calculateHalsteadFromCounts(uniqueOperators, uniqueOperands, totalOperators, totalOperands) {
    const vocabulary = uniqueOperators + uniqueOperands;
    const length = totalOperators + totalOperands;
    const volume = vocabulary === 0 ? 0 : length * Math.log2(vocabulary);
    const difficulty = uniqueOperands === 0 ? 0 : (uniqueOperators / 2) * (totalOperands / uniqueOperands);
    const effort = difficulty * volume;
    const timeSeconds = effort / 18;
    const defects = volume / 3000;

    return {
        uniqueOperators,
        uniqueOperands,
        totalOperators,
        totalOperands,
        vocabulary,
        length,
        volume: Number(volume.toFixed(2)),
        difficulty: Number(difficulty.toFixed(2)),
        effort: Number(effort.toFixed(2)),
        timeSeconds: Number(timeSeconds.toFixed(2)),
        timeHours: Number((timeSeconds / 3600).toFixed(2)),
        defects: Number(defects.toFixed(4))
    };
}

function calculateFileHalstead(filePath) {
    const parsed = parseFile(filePath);

    if (parsed.error) {
        return {
            filePath,
            error: parsed.error,
            metrics: calculateHalsteadFromCounts(0, 0, 0, 0)
        };
    }

    const operators = createTokenCollection();
    const operands = createTokenCollection();

    traverse(parsed.ast, {
        enter(path) {
            const node = path.node;

            if (node.operator) {
                addToken(operators, node.operator);
            }

            if (node.type) {
                addToken(operators, node.type);
            }

            if (node.name) {
                addToken(operands, node.name);
            }

            if (Object.prototype.hasOwnProperty.call(node, "value")) {
                addToken(operands, node.value);
            }
        }
    });

    return {
        filePath,
        error: null,
        metrics: calculateHalsteadFromCounts(
            operators.unique.size,
            operands.unique.size,
            operators.total,
            operands.total
        )
    };
}

function calculateRepoHalstead(repoPath) {
    const files = scanSourceFiles(repoPath);
    const fileMetrics = files.map((file) => ({
        file: file.relativePath,
        ...calculateFileHalstead(file.absolutePath)
    }));

    const totals = fileMetrics.reduce((sum, file) => {
        sum.uniqueOperators += file.metrics.uniqueOperators;
        sum.uniqueOperands += file.metrics.uniqueOperands;
        sum.totalOperators += file.metrics.totalOperators;
        sum.totalOperands += file.metrics.totalOperands;
        return sum;
    }, {
        uniqueOperators: 0,
        uniqueOperands: 0,
        totalOperators: 0,
        totalOperands: 0
    });

    return {
        files: fileMetrics,
        summary: calculateHalsteadFromCounts(
            totals.uniqueOperators,
            totals.uniqueOperands,
            totals.totalOperators,
            totals.totalOperands
        )
    };
}

module.exports = {
    calculateFileHalstead,
    calculateRepoHalstead,
    calculateHalsteadFromCounts
};

if (require.main === module) {
    const repoPath = process.argv[2] || ".";
    console.log(JSON.stringify(calculateRepoHalstead(repoPath), null, 2));
}
