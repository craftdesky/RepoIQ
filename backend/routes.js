const express = require("express");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { v4: uuidv4 } = require("uuid");
const { analyzeRepo } = require("../analyzer/analyzeRepo");

const router = express.Router();

const TEMP_DIR = path.join(__dirname, "temp-clones");

const GITHUB_URL_REGEX =
    /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/;

const MAX_CLONE_TIMEOUT_MS = 120_000; // 2 minutes

function isValidGitHubUrl(url) {
    return GITHUB_URL_REGEX.test(url);
}

function cleanupDir(dirPath) {
    try {
        fs.rmSync(dirPath, { recursive: true, force: true });
    } catch (err) {
        console.error(`[cleanup] Failed to remove ${dirPath}:`, err.message);
    }
}

// ---------------------------------------------------------------------------
// POST /api/analyze/local
// ---------------------------------------------------------------------------
router.post("/analyze/local", (req, res, next) => {
    try {
        const { repoPath } = req.body;

        if (!repoPath || typeof repoPath !== "string") {
            return res.status(400).json({ error: "repoPath is required" });
        }

        const resolved = path.resolve(repoPath);

        if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
            return res
                .status(400)
                .json({ error: `Path does not exist or is not a directory: ${resolved}` });
        }

        const result = analyzeRepo(resolved);

        return res.json({
            source: "local",
            repoPath: resolved,
            analysis: result
        });
    } catch (err) {
        next(err);
    }
});

// ---------------------------------------------------------------------------
// POST /api/analyze/git
// ---------------------------------------------------------------------------
router.post("/analyze/git", (req, res, next) => {
    let cloneDir = null;

    try {
        const { gitUrl } = req.body;

        if (!gitUrl || typeof gitUrl !== "string") {
            return res.status(400).json({ error: "gitUrl is required" });
        }

        if (!isValidGitHubUrl(gitUrl)) {
            return res.status(400).json({
                error:
                    "Invalid GitHub URL. Expected format: https://github.com/<owner>/<repo>"
            });
        }

        // Prepare temp directory
        fs.mkdirSync(TEMP_DIR, { recursive: true });
        cloneDir = path.join(TEMP_DIR, uuidv4());

        // Clone (shallow, single-branch for speed)
        console.log(`[clone] Cloning ${gitUrl} into ${cloneDir} ...`);
        execSync(`git clone --depth 1 --single-branch "${gitUrl}" "${cloneDir}"`, {
            timeout: MAX_CLONE_TIMEOUT_MS,
            stdio: "pipe"
        });
        console.log("[clone] Clone complete.");

        // Analyze
        const result = analyzeRepo(cloneDir);

        // Respond
        res.json({
            source: "github",
            gitUrl,
            analysis: result
        });

        // Cleanup asynchronously — response is already sent
        setImmediate(() => cleanupDir(cloneDir));
    } catch (err) {
        // Make sure we clean up even on failure
        if (cloneDir) {
            cleanupDir(cloneDir);
        }

        // Friendly messages for common clone errors
        if (err.message && err.message.includes("ETIMEDOUT")) {
            return res
                .status(504)
                .json({ error: "Clone timed out. The repository may be too large." });
        }

        if (err.status === 128 || (err.message && err.message.includes("fatal:"))) {
            return res.status(400).json({
                error:
                    "Git clone failed. The repository may be private or the URL may be incorrect."
            });
        }

        next(err);
    }
});

module.exports = router;
