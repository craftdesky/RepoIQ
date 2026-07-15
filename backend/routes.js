const express = require("express");
const controller = require("./controller.js");

const router = express.Router();

router.post("/analyze/local", controller.analyzeLocalRepo);  // POST /api/analyze/local

router.post("/analyze/git", controller.analyzeGithubRepo);   // POST /api/analyze/git

router.post("/paths", controller.getDependencyPaths);   // POST /api/paths

router.get("/ai/status", controller.getAIStatus);   // GET /api/ai/status

router.post("/ai/summary", controller.getAISummary);   // POST /api/ai/summary

router.post("/ai/onboarding", controller.getAIOnbaording);   // POST /api/ai/onboarding

router.post("/ai/chat", controller.getAIChat);   // POST /api/ai/chat

router.post("/ai/docs", controller.getAIDocs);   // POST /ai/docs

router.post("/ai/architecture-insights", controller.getAIArchInsights);   // POST /ai/architecture-insights

module.exports = router;