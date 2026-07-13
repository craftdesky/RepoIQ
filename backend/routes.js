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
    }
    catch (err) {
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
    }
    catch (err) {
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
    }
    catch (err) {
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
    }
    catch (err) {
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
        const { getCache, setCache } = require("./services/cacheService");

        if (!isAiConfigured()) {
            return res.status(503).json({
                error: "AI service is not configured. Set GEMINI_API_KEY in your backend .env file."
            });
        }

        const { projectMetadata, stats, metrics, repoKey } = req.body;

        if (!projectMetadata && !stats) {
            return res.status(400).json({ error: "projectMetadata or stats are required." });
        }

        // Check cache
        if (repoKey) {
            const cached = getCache(repoKey, "summary");
            if (cached) return res.json(cached);
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

        const result = { summary };
        if (repoKey) setCache(repoKey, "summary", result);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});

// ---------------------------------------------------------------------------
// POST /api/ai/onboarding
// ---------------------------------------------------------------------------
router.post("/ai/onboarding", async (req, res, next) => {
    try {
        const { isAiConfigured, generateText } = require("./services/aiService");
        const { getCache, setCache } = require("./services/cacheService");

        if (!isAiConfigured()) {
            return res.status(503).json({
                error: "Gemini API key not found."
            });
        }

        const { experience, goal, techFocus, projectMetadata, stats, metrics, repoKey } = req.body;

        // Check cache
        const cacheKey = `onboarding_${experience}_${goal}_${techFocus}`;
        if (repoKey) {
            const cached = getCache(repoKey, cacheKey);
            if (cached) return res.json(cached);
        }

        if (!experience || !goal || !techFocus) {
            return res.status(400).json({ error: "experience, goal, and techFocus are required." });
        }

        // Build context sections
        const readme = projectMetadata?.readme
            ? projectMetadata.readme.slice(0, 4000)
            : "No README available.";

        const pkg = projectMetadata?.packageJson;
        const dependencies = pkg
            ? `${(pkg.dependencies || []).join(", ") || "None"}`
            : "Not available";

        const totalNodes = stats?.totalNodes ?? "N/A";
        const totalEdges = stats?.totalEdges ?? "N/A";

        const codeQualityScore = metrics?.codeQuality?.summary?.overallQualityScore ?? "N/A";
        const grade = metrics?.codeQuality?.summary?.grade ?? "N/A";
        const healthScore = metrics?.architecturalHealth?.score ?? "N/A";
        const healthLabel = metrics?.architecturalHealth?.label ?? "N/A";

        const topHotspots = (metrics?.hotspots?.files || [])
            .slice(0, 5)
            .map(h => `${h.file || h.id} (score: ${h.hotspotScore ?? "?"})`)
            .join(", ") || "None identified";

        const systemInstruction = `You are an expert Technical Lead onboarding a new developer to this codebase. Your goal is to write a highly tailored, clear, and actionable markdown onboarding guide. Be direct, technical, and use bullet points. Do not include generic filler.`;

        const prompt = `Generate a structured, personalized learning path for me based on my developer profile:
- Experience Level: ${experience}
- Onboarding Goal: ${goal}
- Primary Tech Focus: ${techFocus}

Use the following repository context, stats, and static analysis metrics to tailor your guide:

## README.md Context
${readme}

## Project Dependencies
${dependencies}

## Codebase Stats
- Total Files: ${totalNodes}
- Total Dependencies: ${totalEdges}

## Code Health & Architectural Metrics
- Overall Code Quality: ${codeQualityScore}/100 (Grade ${grade})
- Architectural Health: ${healthScore}/100 (${healthLabel})
- Hotspot Files (High complexity/debt/coupling): ${topHotspots}

Please structure the markdown guide into these exact sections:
1. **Recommended Entry Points**: Suggest the 3 most important files/folders to read first, and justify why based on my Tech Focus and Goal.
2. **Personalized Reading Flow**: A step-by-step reading roadmap tailored to my Goal.
3. **Guardrails & Health Alerts**: Alert me to the top 2-3 hotspots or highly coupled areas to be careful of when making changes.
4. **Suggested Hands-on Starter Task**: A practical, low-risk task (e.g., adding a test, tracing a route, adding a log) to help me run my first code modification.`;

        const guide = await generateText(prompt, systemInstruction, {
            temperature: 0.4,
            maxOutputTokens: 2048
        });

        const result = { guide };
        if (repoKey) setCache(repoKey, cacheKey, result);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});

// ---------------------------------------------------------------------------
// POST /api/ai/chat
// ---------------------------------------------------------------------------
router.post("/ai/chat", async (req, res, next) => {
    try {
        const { isAiConfigured, generateText } = require("./services/aiService");

        if (!isAiConfigured()) {
            return res.status(503).json({
                error: "Gemini API key not found."
            });
        }

        const { messages, projectMetadata, stats, metrics, graph } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: "messages array is required." });
        }

        // Build compact codebase context for the system instruction
        const contextParts = [];

        // README
        if (projectMetadata?.readme) {
            contextParts.push(`## README\n${projectMetadata.readme.slice(0, 3000)}`);
        }

        // Dependencies
        const pkg = projectMetadata?.packageJson;
        if (pkg) {
            contextParts.push(`## Dependencies\n${(pkg.dependencies || []).join(", ") || "None"}`);
        }

        // File list
        if (graph?.nodes && Array.isArray(graph.nodes)) {
            const fileList = graph.nodes
                .slice(0, 100) // cap to avoid token overflow
                .map(n => n.id)
                .join("\n");
            contextParts.push(`## File Paths (${graph.nodes.length} total)\n${fileList}${graph.nodes.length > 100 ? `\n... and ${graph.nodes.length - 100} more` : ""}`);
        }

        // Stats
        if (stats) {
            contextParts.push(`## Stats\n- Files: ${stats.totalNodes || "N/A"}\n- Dependencies: ${stats.totalEdges || "N/A"}\n- Avg degree: ${stats.avgDegree || "N/A"}`);
        }

        // Code quality
        if (metrics?.codeQuality?.summary) {
            const cq = metrics.codeQuality.summary;
            contextParts.push(`## Code Quality\n- Score: ${cq.overallQualityScore}/100 (${cq.rating}, Grade ${cq.grade})`);
        }

        // Architectural health
        if (metrics?.architecturalHealth) {
            const ah = metrics.architecturalHealth;
            contextParts.push(`## Architectural Health\n- Score: ${ah.score}/100 (${ah.label})`);
        }

        // Hotspots
        const topHotspots = (metrics?.hotspots?.files || [])
            .slice(0, 5)
            .map(h => `${h.file || h.id} (score: ${h.hotspotScore ?? "?"})`)
            .join(", ");
        if (topHotspots) {
            contextParts.push(`## Top Hotspots\n${topHotspots}`);
        }

        // Cycles
        if (metrics?.cycles && metrics.cycles.length > 0) {
            contextParts.push(`## Circular Dependencies\n${metrics.cycles.length} cycle(s) detected.`);
        }

        const codebaseContext = contextParts.join("\n\n");

        const systemInstruction = `You are an expert code assistant embedded inside a repository analysis tool called RepoIQ. You have deep knowledge of this specific codebase based on the structural context below. Answer questions about files, dependencies, architecture, complexity, and code quality. Be concise, technical, and precise. Use markdown formatting. Reference specific file paths when relevant.

--- CODEBASE CONTEXT ---
${codebaseContext}
--- END CONTEXT ---`;

        // Extract latest user message text to use as prompt
        const lastUserMsg = messages[messages.length - 1];
        const prompt = lastUserMsg?.parts?.[0]?.text || lastUserMsg?.text || "";

        // Build conversation history (excluding the last message which becomes the prompt)
        const history = messages.slice(0, -1).map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.parts?.[0]?.text || m.text || ""}`).join("\n\n");

        const fullPrompt = history
            ? `Previous conversation:\n${history}\n\nUser: ${prompt}`
            : prompt;

        const reply = await generateText(fullPrompt, systemInstruction, {
            temperature: 0.4,
            maxOutputTokens: 2048
        });

        res.json({ reply });
    }
    catch (err) {
        next(err);
    }
});

// ---------------------------------------------------------------------------
// POST /ai/docs
// ---------------------------------------------------------------------------
router.post("/ai/docs", async (req, res, next) => {
    try {
        const { isAiConfigured, generateText } = require("./services/aiService");
        const { getCache, setCache } = require("./services/cacheService");

        if (!isAiConfigured()) {
            return res.status(503).json({
                error: "AI service is not configured. Set GEMINI_API_KEY in your backend .env file."
            });
        }

        const { section, projectMetadata, stats, metrics, graph, repoKey } = req.body;

        // Check cache
        const docsCacheKey = `docs_${section}`;
        if (repoKey) {
            const cached = getCache(repoKey, docsCacheKey);
            if (cached) return res.json(cached);
        }

        if (!section) {
            return res.status(400).json({ error: "section parameter is required." });
        }

        const readme = projectMetadata?.readme
            ? projectMetadata.readme.slice(0, 4000)
            : "No README available.";

        const pkg = projectMetadata?.packageJson;
        const packageDependencies = pkg
            ? `${(pkg.dependencies || []).join(", ") || "None"}`
            : "Not available";

        const scripts = pkg && pkg.scripts
            ? `${(pkg.scripts || []).join(", ") || "None"}`
            : "Not available";

        const totalNodes = stats?.totalNodes ?? "N/A";
        const totalEdges = stats?.totalEdges ?? "N/A";

        const filePaths = (graph?.nodes && Array.isArray(graph.nodes))
            ? graph.nodes.slice(0, 100).map(n => n.id).join("\n")
            : "N/A";

        const couplingDensity = metrics?.couplingDensity?.density ?? "N/A";
        const cyclesCount = metrics?.cycles ? metrics.cycles.length : 0;

        const topHotspots = (metrics?.hotspots?.files || [])
            .slice(0, 5)
            .map(h => `${h.file || h.id} (score: ${h.hotspotScore ?? "?"})`)
            .join(", ") || "None identified";

        const codeQualityScore = metrics?.codeQuality?.summary?.overallQualityScore ?? "N/A";
        const grade = metrics?.codeQuality?.summary?.grade ?? "N/A";

        const systemInstruction = `You are a senior software architect creating publication-quality technical documentation for a codebase. Your output must be written in clean, professional Markdown. Use precise technical terminology, clear section headings, and bullet points. Avoid filler text.`;

        let prompt = "";

        if (section === "architecture") {
            prompt = `Generate a comprehensive **Architecture & Module Structure** documentation for this repository.

Developer context and metrics:
- Total Files: ${totalNodes}
- File paths list:
${filePaths}
- README Context:
${readme}

Please structure the document with the following headers:
# Codebase Architecture & Modules
## 1. Directory Structure Overview
*(Describe the role of each primary directory and how files are organized)*
## 2. Structural Design Patterns
*(Explain the architectural style, e.g., Layered, MVC, Client-Server, Modular, or Monolithic, based on the file layout)*
## 3. Critical Entry Points
*(Identify the key files that boot/start the application or orchestrate the main flows)*`;
        } else if (section === "dependencies") {
            prompt = `Generate a comprehensive **Dependency & Data Flow** documentation for this repository.

Developer context and metrics:
- Total Dependencies: ${totalEdges}
- Project Dependencies (from package.json): ${packageDependencies}
- Modularity / Coupling Density: ${couplingDensity}
- Circular Cycles detected: ${cyclesCount}
- Top Hotspots (Files with high complexity/coupling): ${topHotspots}

Please structure the document with the following headers:
# Dependency & Data Flow Analysis
## 1. System Integration & Data Flow
*(Describe how modules integrate and how data flows from entry files down to underlying services)*
## 2. Modularity & Coupling Assessment
*(Evaluate the coupling density. Explain why the top hotspots are highly coupled and their impact on change ripple effects)*
## 3. Circular Dependencies
*(List/explain any circular dependency cycles found, or confirm if the codebase is cleanly acyclic)*`;
        } else if (section === "setup") {
            prompt = `Generate a comprehensive **Quick-Start & Setup Guide** for this repository.

Developer context:
- Project dependencies: ${packageDependencies}
- Package scripts: ${scripts}
- README context:
${readme}

Please structure the document with the following headers:
# Quick-Start & Setup Guide
## 1. Prerequisites & Environment Setup
*(Document the software prerequisites, database dependencies, and necessary environment variables)*
## 2. Local Installation & Run
*(Write a step-by-step developer setup checklist to download dependencies, build the project, and run it locally)*
## 3. Command Scripts Dictionary
*(Explain the purpose and usage of all available package/command scripts)*`;
        } else if (section === "api") {
            prompt = `Generate a comprehensive **API & Integration Map** for this repository.

Developer context:
- File paths list:
${filePaths}
- Project dependencies: ${packageDependencies}

Please structure the document with the following headers:
# API & Integration Map
## 1. Routing Controllers & Endpoints
*(Identify router, controllers, or endpoint files and explain what request paths they handle)*
## 2. Request & Response Lifecycle
*(Map how a client request is handled, from the entry port/server down to the controllers and response output)*
## 3. Integration Guidelines
*(Document how external clients or other modules should interface with this project)*`;
        } else if (section === "readme") {
            prompt = `Generate a clean, professional, and ready-to-use **README.md** summarizing this repository in brief.

Developer context and metrics:
- Overall Code Quality: ${codeQualityScore}/100 (Grade ${grade})
- Project dependencies: ${packageDependencies}
- Stats: Files: ${totalNodes}, Dependencies: ${totalEdges}
- README context:
${readme}

Please structure the document with the following headers:
# Project Overview
## 1. Core Purpose & Value Proposition
*(Summarize what this repository does, its target audience, and the problem it solves in brief)*
## 2. Key Features & Capabilities
*(Provide a bulleted list of the main features present in the code)*
## 3. Technology Stack & Key Libraries
*(List the main languages, frameworks, and database packages identified)*
## 4. Architectural Summary
*(Provide a high-level overview of the directory layout and system architecture)*`;
        } else {
            return res.status(400).json({ error: "Invalid section parameter specified." });
        }

        const markdown = await generateText(prompt, systemInstruction, {
            temperature: 0.3,
            maxOutputTokens: 2500
        });

        const docsResult = { markdown };
        if (repoKey) setCache(repoKey, docsCacheKey, docsResult);
        res.json(docsResult);
    }
    catch (err) {
        next(err);
    }
});

// ---------------------------------------------------------------------------
// POST /ai/architecture-insights
// ---------------------------------------------------------------------------
router.post("/ai/architecture-insights", async (req, res, next) => {
    try {
        const { isAiConfigured, generateJSON } = require("./services/aiService");
        const { getCache, setCache } = require("./services/cacheService");

        if (!isAiConfigured()) {
            return res.status(503).json({
                error: "AI service is not configured. Set GEMINI_API_KEY in your backend .env file."
            });
        }

        const { projectMetadata, stats, graph, repoKey } = req.body;

        // Check cache
        if (repoKey) {
            const cached = getCache(repoKey, "architecture-insights");
            if (cached) return res.json(cached);
        }

        const readme = projectMetadata?.readme
            ? projectMetadata.readme.slice(0, 3000)
            : "No README available.";

        const pkg = projectMetadata?.packageJson;
        const packageDeps = pkg
            ? `${(pkg.dependencies || []).join(", ") || "None"}`
            : "Not available";

        const filePaths = (graph?.nodes && Array.isArray(graph.nodes))
            ? graph.nodes.slice(0, 120).map(n => n.id).join("\n")
            : "N/A";

        const totalFiles = stats?.totalNodes ?? "N/A";
        const totalEdges = stats?.totalEdges ?? "N/A";

        const systemInstruction = `You are an expert software architect. Analyze the repository structure below and return a structured JSON response with three fields:

1. "pattern": Identify the dominant architectural pattern (e.g. MVC, Layered Architecture, Microservices, Monolithic, Client-Server, Event-Driven, Component-Based, or other). Include a confidence level (Low, Medium, or High) and a brief explanation of why you identified this pattern.

2. "layers": Classify files into logical architectural layers such as UI/Presentation, Business Logic/Services, Data Access/Models, Configuration, Routing/Controllers, Authentication/Security, Utilities/Helpers, Testing, Build/Tooling, or any other relevant layers. Each layer should have a name, description, and a list of file paths belonging to it. Every file should belong to exactly one layer.

3. "responsibilities": For each file, assign a short responsibility tag (e.g. Controller, Service, Model, View, Config, Utility, Test, Middleware, Router) and a one-line description of what the file does.

Be precise and base your classification on file names, directory structure, and known framework conventions.`;

        const prompt = `Analyze this repository and classify its architecture:

- Total Files: ${totalFiles}
- Total Dependencies: ${totalEdges}
- Project Dependencies: ${packageDeps}
- README:
${readme}

- File Paths:
${filePaths}`;

        const responseSchema = {
            type: "object",
            properties: {
                pattern: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        confidence: { type: "string", enum: ["Low", "Medium", "High"] },
                        explanation: { type: "string" }
                    },
                    required: ["name", "confidence", "explanation"]
                },
                layers: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            description: { type: "string" },
                            files: { type: "array", items: { type: "string" } }
                        },
                        required: ["name", "description", "files"]
                    }
                },
                responsibilities: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            file: { type: "string" },
                            responsibility: { type: "string" },
                            description: { type: "string" }
                        },
                        required: ["file", "responsibility", "description"]
                    }
                }
            },
            required: ["pattern", "layers", "responsibilities"]
        };

        const result = await generateJSON(prompt, systemInstruction, responseSchema, {
            temperature: 0.2,
            maxOutputTokens: 4096
        });

        if (repoKey) setCache(repoKey, "architecture-insights", result);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});

module.exports = router;