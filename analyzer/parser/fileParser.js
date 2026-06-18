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
        "topLevelAwait"
    ]
};

function parseFile(filePath, options = {}) {
    // given a file path, read code and return AST (or corresponding error)

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
                message: error.message,
                code: "FILE_READ_ERROR",
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

// printing for testing
if (require.main === module) {
    // cmd : node analyzer/parser/fileParser.js <file-path>
    const target = process.argv[2];

    if (!target) {
        console.error("Wrong input!");
        process.exit(1);
    }

    const result = parseFile(target);
    console.log(JSON.stringify(result, null, 2));
}
