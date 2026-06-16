const traverse = require("@babel/traverse").default;

function getStringLiteralValue(node) {
    if (!node) return null;
    if (node.type === "StringLiteral") return node.value;
    if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
        return node.quasis[0].value.cooked;
    }
    return null;
}

function extractImports(ast) {
    const imports = [];
    const exports = [];
    const dynamicImports = [];
    const requires = [];

    if (!ast || !ast.program) {
        return {
            imports,
            exports,
            dynamicImports,
            requires
        };
    }

    traverse(ast, {
        ImportDeclaration(path) {
            imports.push({
                source: path.node.source.value,
                specifiers: path.node.specifiers.map((specifier) => ({
                    type: specifier.type,
                    local: specifier.local ? specifier.local.name : null,
                    imported: specifier.imported ? specifier.imported.name : null
                })),
                kind: "static"
            });
        },
        ExportNamedDeclaration(path) {
            if (path.node.source) {
                exports.push({
                    source: path.node.source.value,
                    type: "reexport"
                });
            } else {
                exports.push({
                    source: null,
                    type: "named"
                });
            }
        },
        ExportAllDeclaration(path) {
            exports.push({
                source: path.node.source.value,
                type: "all"
            });
        },
        Import(path) {
            const parent = path.parentPath && path.parentPath.node;
            const source = parent && parent.arguments && parent.arguments[0];
            const value = getStringLiteralValue(source);

            if (value) {
                dynamicImports.push({
                    source: value,
                    kind: "dynamic"
                });
            }
        },
        CallExpression(path) {
            const callee = path.node.callee;

            if (callee.type !== "Identifier" || callee.name !== "require") {
                return;
            }

            const value = getStringLiteralValue(path.node.arguments[0]);
            if (!value) return;

            requires.push({
                source: value,
                kind: "commonjs"
            });
        }
    });

    return {
        imports,
        exports,
        dynamicImports,
        requires
    };
}

module.exports = {
    extractImports,
    getStringLiteralValue
};
