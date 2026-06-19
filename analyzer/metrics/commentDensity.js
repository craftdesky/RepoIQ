("use strict");
const fs = require("fs");
const { scanSourceFiles } = require("../parser/fileScanner");
const { parseFile } = require("../parser/fileParser");

function analyzeLines(content) {
	const lines = content.length === 0 ? [] : content.split(/\r\n|\r|\n/);
	let blankLines = 0;
	let pureCommentLines = 0;
	let linesWithComments = 0;
	let inBlock = false;

	for (let rawLine of lines) {
		const line = rawLine;
		const trimmed = line.trim();

		if (trimmed === "") {
			blankLines += 1;
			continue;
		}

		let countedAsComment = false;

		if (inBlock) {
			linesWithComments += 1;
			countedAsComment = true;
			if (trimmed.includes("*/")) {
				inBlock = false;
			}
			continue;
		}

		const blockStart = trimmed.indexOf("/*");
		const lineComment = trimmed.indexOf("//");

		if (blockStart === 0) {
			pureCommentLines += 1;
			linesWithComments += 1;
			countedAsComment = true;
			if (!trimmed.includes("*/")) {
				inBlock = true;
			}
			continue;
		}

		if (lineComment === 0) {
			pureCommentLines += 1;
			linesWithComments += 1;
			countedAsComment = true;
			continue;
		}

		if (blockStart > 0) {
			linesWithComments += 1;
			countedAsComment = true;
			if (!trimmed.includes("*/") || trimmed.indexOf("*/") < blockStart) {
				// block continues
				inBlock = true;
			}
			continue;
		}

		if (lineComment > 0) {
			linesWithComments += 1;
			countedAsComment = true;
			continue;
		}
	}

	const totalLines = lines.length;
	const codeLines = Math.max(0, totalLines - blankLines - pureCommentLines);

	return {
		totalLines,
		blankLines,
		pureCommentLines,
		linesWithComments,
		codeLines,
		commentDensity: codeLines === 0 ? 0 : Number((pureCommentLines / codeLines).toFixed(3)),
		commentCoverage: totalLines === 0 ? 0 : Number((linesWithComments / totalLines).toFixed(3))
	};
}

function calculateFileCommentDensity(filePath) {
	let content;
	try {
		content = fs.readFileSync(filePath, "utf8");
	}
	catch (err) {
		return {
			filePath,
			error: {
				message: err.message,
				code: "FILE_READ_ERROR"
			},
			metrics: null
		};
	}

	const parsed = parseFile(filePath);
	let parsedCommentLines = null;

	if (!parsed.error && parsed.ast && Array.isArray(parsed.ast.comments) && parsed.ast.comments.length > 0) {
		try {
			parsedCommentLines = parsed.ast.comments.reduce((sum, c) => {
				if (c.loc && c.loc.start && c.loc.end) {
					return sum + (c.loc.end.line - c.loc.start.line + 1);
				}
				return sum + (c.value ? c.value.split(/\r\n|\r|\n/).length : 1);
			}, 0);
		}
		catch (e) {
			parsedCommentLines = null;
		}
	}

	const scanned = analyzeLines(content);

	if (parsedCommentLines !== null) {
		scanned.pureCommentLines = parsedCommentLines;
		scanned.commentDensity = scanned.codeLines === 0 ? 0 : Number((parsedCommentLines / scanned.codeLines).toFixed(3));
	}

	return {
		filePath,
		error: null,
		metrics: scanned
	};
}

function calculateRepoCommentDensity(repoPath) {
	const files = scanSourceFiles(repoPath);

	const fileMetrics = files.map((file) => ({
		file: file.relativePath,
		...calculateFileCommentDensity(file.absolutePath)
	}));

	const totals = fileMetrics.reduce((sum, f) => {
		if (f.metrics) {
			sum.totalLines += f.metrics.totalLines || 0;
			sum.blankLines += f.metrics.blankLines || 0;
			sum.pureCommentLines += f.metrics.pureCommentLines || 0;
			sum.linesWithComments += f.metrics.linesWithComments || 0;
			sum.codeLines += f.metrics.codeLines || 0;
		}
		return sum;
	}, { totalLines: 0, blankLines: 0, pureCommentLines: 0, linesWithComments: 0, codeLines: 0 });

	const summary = {
		totalLines: totals.totalLines,
		blankLines: totals.blankLines,
		pureCommentLines: totals.pureCommentLines,
		linesWithComments: totals.linesWithComments,
		codeLines: totals.codeLines,
		commentDensity: totals.codeLines === 0 ? 0 : Number((totals.pureCommentLines / totals.codeLines).toFixed(3)),
		commentCoverage: totals.totalLines === 0 ? 0 : Number((totals.linesWithComments / totals.totalLines).toFixed(3))
	};

	return {
		files: fileMetrics,
		summary
	};
}

module.exports = {
	analyzeLines,
	calculateFileCommentDensity,
	calculateRepoCommentDensity
};


// printing for testing
if (require.main === module) {
	const repoPath = process.argv[2] || ".";
	console.log(JSON.stringify(calculateRepoCommentDensity(repoPath), null, 2));
}

