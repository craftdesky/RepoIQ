const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");

const DEFAULT_PARSER_OPTIONS = {
    sourceType: "unambiguous",
    allowReturnOutsideFunction: true,
    errorRecovery: false,
    plugins: [
        "jsx",
        "typescript",
        "dynamicImport",
        "importMeta",
        "classProperties",
        "classPrivateProperties",
        "classPrivateMethods",
        "optionalChaining",
        "nullishCoalescingOperator",
        "topLevelAwait"
    ]
};

function parseFile(filePath, options = {}) {
    const resolvedPath = path.resolve(filePath);
    const parserOptions = {...DEFAULT_PARSER_OPTIONS, ...options};

    if (!fs.existsSync(resolvedPath)) {
        return {
            filePath: resolvedPath,
            ast: null,
            error: {
                message: `File does not exist: ${resolvedPath}`,
                code: "FILE_NOT_FOUND"
            }
        };
    }

    let code;

    try{
        code = fs.readFileSync(resolvedPath, "utf8");
    }
    catch (error) {
        return {
            filePath: resolvedPath,
            ast: null,
            error: {
                message: `Failed to read file: ${resolvedPath}`,
                code: "FILE_READ_ERROR",
                cause: error.message
            }
        };
    }

    try {
        const ast = parser.parse(code, {...parserOptions, sourceFilename: resolvedPath});

        return {
            filePath: resolvedPath,
            ast,
            error: null
        };
    }
    catch (error) {
        return {
            filePath: resolvedPath,
            ast: null,
            error: {
                message: error.message,
                code: "PARSER_ERROR",
                loc: error.loc || null,
                reasonCode: error.reasonCode || null
            }
        };
    }
}

module.exports = {
    parseFile,
    DEFAULT_PARSER_OPTIONS
};


// Printing for testing
const target = process.argv[2];

const result = parseFile(target);
console.log(JSON.stringify(result, null, 2));

