// when a file says “use X”, find which file 'X' refers to and group files into three groups: files found, files that come from outside the project and files not found.

// resolved -> from inside repo
// external -> from outside repo
// unresolved -> not found

const fs = require("fs");
const path = require("path");

const DEFAULT_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".json"];

function isRelativeSpecifier(file) {
    return typeof file === "string" && (file.startsWith("./") || file.startsWith("../") || file.startsWith("/"));
}

function fileExists(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    }
    catch {
        return false;
    }
}

function resolveCandidate(candidatePath, extensions) {
    if (path.extname(candidatePath)) {
        return fileExists(candidatePath) ? path.normalize(candidatePath) : null;
    }

    for (const extension of extensions) {
        const directFile = `${candidatePath}${extension}`;
        if (fileExists(directFile)) {
            return path.normalize(directFile);
        }
    }

    for (const extension of extensions) {
        const indexFile = path.join(candidatePath, `index${extension}`);
        if (fileExists(indexFile)) {
            return path.normalize(indexFile);
        }
    }

    return null;
}

function normalizeImportEntry(entry) {
    if (typeof entry === "string") {
        return { source: entry };
    }

    if (entry && typeof entry === "object") {
        return {
            source: entry.source || entry.specifier || entry.path || null,
            kind: entry.kind || entry.type || null
        };
    }

    return { source: null };
}

function cleanImports(baseFile, imports, options = {}) {
    const extensions = options.extensions || DEFAULT_EXTENSIONS;
    const absoluteBaseFile = path.resolve(baseFile);
    const baseDirectory = path.dirname(absoluteBaseFile);
    const list = Array.isArray(imports) ? imports : [imports];

    const cleaned = {
        resolved: [],
        external: [],
        unresolved: []
    };

    for (const entry of list) {
        const normalized = normalizeImportEntry(entry);
        const source = normalized.source;

        if (!source) continue;

        if (!isRelativeSpecifier(source)) {
            cleaned.external.push({
                source,
                kind: normalized.kind || "external"
            });
            continue;
        }

        const candidatePath = path.resolve(baseDirectory, source);
        const resolvedPath = resolveCandidate(candidatePath, extensions);

        if (resolvedPath) {
            cleaned.resolved.push({
                source,
                kind: normalized.kind || "local",
                path: resolvedPath
            });
        }
        else {
            cleaned.unresolved.push({
                source,
                kind: normalized.kind || "local",
                candidatePath: path.normalize(candidatePath)
            });
        }
    }

    return cleaned;
}

module.exports = {
    cleanImports,
    isRelativeSpecifier,
    resolveCandidate
};

// Printing for testing
const baseFile = process.argv[2];
const rawImports = process.argv.slice(3);

if (!baseFile || rawImports.length === 0) {
    console.error("Error");
    process.exit(1);
}

console.log(JSON.stringify(cleanImports(baseFile, rawImports), null, 2));
