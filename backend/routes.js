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

        const result = analyzeRepo(resolved, {
            hotspotConfig: req.body.hotspotConfig
        });

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
        const result = analyzeRepo(cloneDir, {
            hotspotConfig: req.body.hotspotConfig
        });

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

// ---------------------------------------------------------------------------
// POST /api/paths
// ---------------------------------------------------------------------------
router.post("/paths", (req, res, next) => {
    try {
        const { graph, startId, targetId } = req.body;

        if (!graph || !startId || !targetId) {
            return res.status(400).json({ error: "graph, startId, and targetId are required" });
        }

        const { findDependencyPaths } = require("../analyzer/graph/pathFinder");
        
        // Find paths with limits as requested (max 20 paths, max depth 20)
        const result = findDependencyPaths(graph, startId, targetId, {
            maxPaths: 20,
            maxDepth: 20
        });

        res.json(result);
    } catch (err) {
        next(err);
    }
});

// ---------------------------------------------------------------------------
// GET /api/ai/status
// ---------------------------------------------------------------------------
router.get("/ai/status", (_req, res) => {
    const { isAiConfigured } = require("./services/aiService");
    res.json({
        configured: isAiConfigured(),
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash"
    });
});

// ---------------------------------------------------------------------------
// POST /api/ai/summary
// ---------------------------------------------------------------------------
router.post("/ai/summary", async (req, res, next) => {
    try {
        const { isAiConfigured, generateText } = require("./services/aiService");

        if (!isAiConfigured()) {
            return res.status(503).json({
                error: "AI service is not configured. Set GEMINI_API_KEY in your backend .env file."
            });
        }

        const { projectMetadata, stats, metrics } = req.body;

        if (!projectMetadata && !stats) {
            return res.status(400).json({ error: "projectMetadata or stats are required." });
        }

        // Build structured context for the LLM
        const contextParts = [];

        if (projectMetadata?.readme) {
            contextParts.push(`## README.md\n${projectMetadata.readme}`);
        }

        if (projectMetadata?.packageJson) {
            const pkg = projectMetadata.packageJson;
            contextParts.push(`## package.json Summary\n- Name: ${pkg.name || "N/A"}\n- Description: ${pkg.description || "N/A"}\n- Version: ${pkg.version || "N/A"}\n- Dependencies: ${(pkg.dependencies || []).join(", ") || "None"}\n- Dev Dependencies: ${(pkg.devDependencies || []).join(", ") || "None"}\n- Scripts: ${(pkg.scripts || []).join(", ") || "None"}`);
        }

        if (stats) {
            contextParts.push(`## Repository Statistics\n- Total Files: ${stats.totalNodes || "N/A"}\n- Total Dependencies: ${stats.totalEdges || "N/A"}\n- Average Dependencies per File: ${stats.avgDegree || "N/A"}`);
        }

        if (metrics?.codeQuality?.summary) {
            const cq = metrics.codeQuality.summary;
            contextParts.push(`## Code Quality\n- Overall Score: ${cq.overallQualityScore}/100 (${cq.rating}, Grade ${cq.grade})`);
        }

        if (metrics?.architecturalHealth) {
            const ah = metrics.architecturalHealth;
            contextParts.push(`## Architectural Health\n- Health Score: ${ah.score}/100 (${ah.label})`);
        }

        if (metrics?.benchmarking?.assessments) {
            const a = metrics.benchmarking.assessments;
            contextParts.push(`## Engineering Maturity\n- Complexity: ${a.complexity}\n- Maintainability: ${a.maintainability}\n- Maturity Level: ${a.maturity?.level || "N/A"} (${a.maturity?.status || "N/A"})`);
        }

        const contextBlock = contextParts.join("\n\n");

        const systemInstruction = `You are a senior software architect writing a professional, concise summary of a code repository. Your summary should be written in clean Markdown and cover: 1) Project Purpose, 2) Tech Stack & Dependencies, 3) Architecture & Module Structure, 4) Code Health Assessment, 5) Key Observations. Be specific and actionable. Do not include generic filler. Use bullet points and short paragraphs. Keep the total response under 600 words.`;

        const prompt = `Analyze the following repository metadata and metrics, then generate a professional repository summary.\n\n${contextBlock}`;

        const summary = await generateText(prompt, systemInstruction, {
            temperature: 0.3,
            maxOutputTokens: 2048
        });

        res.json({ summary });
    }
    catch (err) {
        next(err);
    }
});

module.exports = router;