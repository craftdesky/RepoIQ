("use strict");
const traverse = require("@babel/traverse").default;
const { scanSourceFiles } = require("../parser/fileScanner");
const { parseFile } = require("../parser/fileParser");

function getFunctionName(path) {
	const node = path.node;

	if (node.id && node.id.name) return node.id.name;
	if (node.key && node.key.name) return node.key.name;

	const parent = path.parentPath;
	if (parent) {
		if (parent.isVariableDeclarator() && parent.node.id && parent.node.id.name) {
			return parent.node.id.name;
		}

		if (parent.isAssignmentExpression() && parent.node.left && parent.node.left.type === "Identifier") {
			return parent.node.left.name;
		}

		if (parent.isProperty() && parent.node.key && parent.node.key.name) {
			return parent.node.key.name;
		}
	}

	return "<anonymous>";
}

function calculateFileCyclomatic(filePath) {
	const parsed = parseFile(filePath);

	if (parsed.error) {
		return {
			filePath,
			error: parsed.error,
			metrics: {
				functions: [],
				summary: {
					totalComplexity: 0,
					averageComplexity: 0,
					highestComplexity: 0,
					functionCount: 0
				}
			}
		};
	}

	const functions = [];

	traverse(parsed.ast, {
		enter(path) {
			const isFn = path.isFunctionDeclaration && path.isFunctionDeclaration() ||
				path.isFunctionExpression && path.isFunctionExpression() ||
				path.isArrowFunctionExpression && path.isArrowFunctionExpression() ||
				path.isClassMethod && path.isClassMethod && path.isClassMethod() ||
				path.isObjectMethod && path.isObjectMethod && path.isObjectMethod();

			if (path.isFunction() || isFn) {
				const node = path.node;
				const name = getFunctionName(path);
				let complexity = 1; // baseline

				path.traverse({
					Function(innerPath) {
						innerPath.skip();
					},
					IfStatement() { complexity += 1; },
					ForStatement() { complexity += 1; },
					ForInStatement() { complexity += 1; },
					ForOfStatement() { complexity += 1; },
					WhileStatement() { complexity += 1; },
					DoWhileStatement() { complexity += 1; },
					SwitchCase(switchPath) {
						if (switchPath.node.test) complexity += 1;
					},
					ConditionalExpression() { complexity += 1; },
					LogicalExpression(logPath) {
						if (logPath.node.operator === "||" || logPath.node.operator === "&&") complexity += 1;
					},
					CatchClause() { complexity += 1; }
				});

				functions.push({
					name,
					complexity,
					loc: node.loc || null
				});
			}
		}
	});

	const totalComplexity = functions.reduce((s, f) => s + f.complexity, 0);
	const functionCount = functions.length;
	const averageComplexity = functionCount ? Number((totalComplexity / functionCount).toFixed(2)) : 0;
	const highestComplexity = functions.reduce((m, f) => Math.max(m, f.complexity), 0);

	return {
		filePath,
		error: null,
		metrics: {
			functions,
			summary: {
				totalComplexity,
				averageComplexity,
				highestComplexity,
				functionCount
			}
		}
	};
}

function calculateRepoCyclomatic(repoPath) {
	const files = scanSourceFiles(repoPath);

	const fileMetrics = files.map((file) => ({
		file: file.relativePath,
		...calculateFileCyclomatic(file.absolutePath)
	}));

	const totals = fileMetrics.reduce((sum, f) => {
		const s = f.metrics && f.metrics.summary ? f.metrics.summary : { totalComplexity: 0, functionCount: 0 };
		sum.totalComplexity += s.totalComplexity || 0;
		sum.functionCount += s.functionCount || 0;
		return sum;
	}, { totalComplexity: 0, functionCount: 0 });

	return {
		files: fileMetrics,
		summary: {
			totalComplexity: totals.totalComplexity,
			functionCount: totals.functionCount,
			averageComplexity: totals.functionCount ? Number((totals.totalComplexity / totals.functionCount).toFixed(2)) : 0
		}
	};
}

module.exports = {
	calculateFileCyclomatic,
	calculateRepoCyclomatic
};


// printing for testing
if (require.main === module) {
	const repoPath = process.argv[2] || ".";
	console.log(JSON.stringify(calculateRepoCyclomatic(repoPath), null, 2));
}

