const fs = require("fs");
const path = require("path");

function getPackageName(specifier) {
    if (!specifier) return "";
    if (specifier.startsWith("@")) {
        const parts = specifier.split("/");
        return parts.slice(0, 2).join("/");
    }
    return specifier.split("/")[0];
}

const nodeBuiltins = new Set([
    "assert", "async_hooks", "buffer", "child_process", "cluster", "console",
    "constants", "crypto", "dgram", "dns", "domain", "events", "fs", "fs/promises",
    "http", "http2", "https", "inspector", "module", "net", "os", "path",
    "path/posix", "path/win32", "perf_hooks", "process", "punycode", "querystring",
    "readline", "repl", "stream", "stream/promises", "string_decoder", "timers",
    "timers/promises", "tls", "trace_events", "tty", "url", "util", "util/types",
    "v8", "vm", "wasi", "worker_threads", "zlib"
]);

function analyzeExternalDependencies(repoPath, graph) {
    let packageJson = {};
    const packageJsonPath = path.join(path.resolve(repoPath), "package.json");
    
    if (fs.existsSync(packageJsonPath)) {
        try {
            packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        } catch (e) {
            console.error("Failed to parse package.json:", e.message);
        }
    }

    const declaredDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies
    };
    
    const declaredPackageNames = new Set(Object.keys(declaredDeps));

    // Extract all external dependencies from the graph
    // graph.externalDependencies has { file: "path/to/file", source: "express", kind: "external" }
    const externalDeps = (graph.externalDependencies || []).map(dep => ({
        file: dep.file,
        package: getPackageName(dep.source),
        rawSource: dep.source
    }));

    // Group by package name
    const packageUsage = {};
    for (const dep of externalDeps) {
        if (!dep.package) continue;
        
        if (!packageUsage[dep.package]) {
            packageUsage[dep.package] = new Set();
        }
        packageUsage[dep.package].add(dep.file);
    }

    const used = [];
    const unused = [];
    const undeclared = [];
    const builtins = [];

    // Check what was declared vs what was used
    for (const pkg of declaredPackageNames) {
        if (packageUsage[pkg]) {
            used.push({
                name: pkg,
                files: Array.from(packageUsage[pkg])
            });
        } else {
            // Check if there are types like @types/pkg which we don't strictly import
            unused.push(pkg);
        }
    }

    // Check what was used vs what was declared
    for (const pkg of Object.keys(packageUsage)) {
        if (!declaredPackageNames.has(pkg)) {
            if (nodeBuiltins.has(pkg) || pkg.startsWith("node:")) {
                builtins.push({
                    name: pkg,
                    files: Array.from(packageUsage[pkg])
                });
            } else {
                undeclared.push({
                    name: pkg,
                    files: Array.from(packageUsage[pkg])
                });
            }
        }
    }

    return {
        summary: {
            declaredCount: declaredPackageNames.size,
            usedCount: used.length,
            unusedCount: unused.length,
            undeclaredCount: undeclared.length,
            builtinCount: builtins.length
        },
        used,
        unused,
        undeclared,
        builtins
    };
}

module.exports = {
    analyzeExternalDependencies,
    getPackageName
};
