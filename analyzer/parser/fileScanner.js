const fs = require("fs");
const path = require("path");

const SUPPORTED_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);
const IGNORED_DIRS = new Set(["node_modules", ".git"]);

function scanSourceFiles(repoPath) {
    const root = path.resolve(repoPath);   // convert to absolute path

    if (!fs.existsSync(root)) {
        throw new Error(`Repository path does not exist: ${root}`);
    }

    const files = [];

    function walk(currentDir) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) {
                if (IGNORED_DIRS.has(entry.name)) continue;
                walk(fullPath);
                continue;
            }

            if (!entry.isFile()) continue;

            const extension = path.extname(entry.name);
            if (!SUPPORTED_EXTENSIONS.has(extension)) continue;

            const content = fs.readFileSync(fullPath, "utf8");

            files.push({
                absolutePath: fullPath.replaceAll("\\", "/"),
                relativePath: path.relative(root, fullPath).replaceAll("\\", "/"),
                extension,
                sizeBytes: Buffer.byteLength(content, "utf8"),
                lineCount: content.length === 0 ? 0 : content.split(/\r\n|\r|\n/).length
            });
        }
    }

    walk(root);

    return files;
}

module.exports = {
    scanSourceFiles
};

// printing for testing
if (require.main === module) {
    const repoPath = process.argv[2] || ".";
    console.log(JSON.stringify(scanSourceFiles(repoPath), null, 2));
}
