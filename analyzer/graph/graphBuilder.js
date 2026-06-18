// A -> B means file A imports something from file B 

const path = require("path");
const { scanSourceFiles } = require("../parser/fileScanner");
const { parseFile } = require("../parser/fileParser");
const { extractImports } = require("../parser/importExtractor");
const { cleanImports } = require("../parser/importCleaner");

function normalizePath(filePath) {
    return filePath.replaceAll("\\", "/");
}

function toRelativeId(repoRoot, filePath) {
    return normalizePath(path.relative(repoRoot, path.resolve(filePath)));
}

function collectDependencyEntries(extractedImports) {
    return [
        ...extractedImports.imports,
        ...extractedImports.dynamicImports,
        ...extractedImports.requires,
        ...extractedImports.exports.filter((entry) => entry.source)
    ];
}

class Graph {
    constructor() {
        this.nodes = new Map();
        this.edges = [];
        this.edgeKeys = new Set();
        this.externalDependencies = [];
        this.unresolvedDependencies = [];
        this.parseErrors = [];
    }

    addNode(id, data = {}) {
        if (!this.nodes.has(id)) {
            this.nodes.set(id, {
                id,
                incoming: 0,
                outgoing: 0,
                dependencies: [],
                dependents: [],
                ...data
            });
            return;
        }

        this.nodes.set(id, {
            ...this.nodes.get(id),
            ...data
        });
    }

    addEdge(from, to, data = {}) {
        this.addNode(from);
        this.addNode(to);

        const edgeKey = `${from}->${to}:${data.source || ""}:${data.kind || ""}`;
        if (this.edgeKeys.has(edgeKey)) return;

        this.edgeKeys.add(edgeKey);
        this.edges.push({
            from,
            to,
            ...data
        });

        const fromNode = this.nodes.get(from);
        const toNode = this.nodes.get(to);

        fromNode.outgoing += 1;
        toNode.incoming += 1;

        if (!fromNode.dependencies.includes(to)) {
            fromNode.dependencies.push(to);
        }

        if (!toNode.dependents.includes(from)) {
            toNode.dependents.push(from);
        }
    }

    addExternalDependency(fileId, dependency) {
        this.externalDependencies.push({
            file: fileId,
            ...dependency
        });
    }

    addUnresolvedDependency(fileId, dependency) {
        this.unresolvedDependencies.push({
            file: fileId,
            ...dependency
        });
    }

    addParseError(fileId, error) {
        this.parseErrors.push({
            file: fileId,
            error
        });
    }

    getNode(id) {
        return this.nodes.get(id) || null;
    }

    getNodes() {
        return Array.from(this.nodes.values());
    }

    getEdges() {
        return [...this.edges];
    }

    toJSON() {
        return {
            nodes: this.getNodes(),
            edges: this.getEdges(),
            externalDependencies: this.externalDependencies,
            unresolvedDependencies: this.unresolvedDependencies,
            parseErrors: this.parseErrors,
            stats: {
                nodeCount: this.nodes.size,
                edgeCount: this.edges.length,
                externalDependencyCount: this.externalDependencies.length,
                unresolvedDependencyCount: this.unresolvedDependencies.length,
                parseErrorCount: this.parseErrors.length
            }
        };
    }
}

function buildGraph(repoPath) {
    const repoRoot = path.resolve(repoPath);
    const graph = new Graph();
    const files = scanSourceFiles(repoRoot);

    for (const file of files) {
        const fileId = normalizePath(file.relativePath);

        graph.addNode(fileId, {
            absolutePath: normalizePath(file.absolutePath),
            extension: file.extension,
            sizeBytes: file.sizeBytes,
            lineCount: file.lineCount
        });
    }

    for (const file of files) {
        const fileId = normalizePath(file.relativePath);
        const parsed = parseFile(file.absolutePath);

        if (parsed.error) {
            graph.addParseError(fileId, parsed.error);
            continue;
        }

        const extractedImports = extractImports(parsed.ast);
        const dependencyEntries = collectDependencyEntries(extractedImports);
        const cleanedImports = cleanImports(file.absolutePath, dependencyEntries);

        for (const dependency of cleanedImports.resolved) {
            const targetId = toRelativeId(repoRoot, dependency.path);

            graph.addEdge(fileId, targetId, {
                source: dependency.source,
                kind: dependency.kind
            });
        }

        for (const dependency of cleanedImports.external) {
            graph.addExternalDependency(fileId, dependency);
        }

        for (const dependency of cleanedImports.unresolved) {
            graph.addUnresolvedDependency(fileId, dependency);
        }
    }

    return graph;
}

module.exports = {
    Graph,
    buildGraph,
    collectDependencyEntries
};


// printing for testing
if (require.main === module) {
    const repoPath = process.argv[2] || ".";
    const graph = buildGraph(repoPath);
    console.log(JSON.stringify(graph.toJSON(), null, 2));
}