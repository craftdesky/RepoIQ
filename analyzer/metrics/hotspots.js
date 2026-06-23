const path = require("path");
const { getNodes, getEdges, normalizeId } = require("../graph/graphUtils");

function getDirectory(fileId) {
    if (!fileId) return ".";
    const dir = path.posix.dirname(fileId);
    return dir === "" ? "." : dir;
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function calculateHotspots(graph, extras = {}, options = {}) {
    const impact = extras.impact || {};
    const cyclomaticComplexity = extras.cyclomaticComplexity || {};
    const cycles = extras.cycles || [];

    const weights = options.weights || {
        coupling: 0.35,
        impact: 0.35,
        complexity: 0.25,
        cycle: 0.05
    };

    const topN = Number.isInteger(options.topN) ? options.topN : 5;

    const nodes = getNodes(graph) || [];
    const edges = getEdges(graph) || [];

    // Initialize maps
    const outgoingMap = new Map();
    const incomingMap = new Map();
    const outgoingExternalMap = new Map();
    const incomingExternalMap = new Map();
    const dirMap = new Map();

    for (const node of nodes) {
        const id = normalizeId(node.id);
        const dir = getDirectory(id);
        dirMap.set(id, dir);

        // initialize counts to zero; we'll compute them from the edges list
        outgoingMap.set(id, 0);
        incomingMap.set(id, 0);
        outgoingExternalMap.set(id, 0);
        incomingExternalMap.set(id, 0);
    }

    // Walk edges once to compute external counts reliably
    for (const edge of edges) {
        const from = normalizeId(edge.from || "");
        const to = normalizeId(edge.to || "");
        const fromDir = getDirectory(from);
        const toDir = getDirectory(to);

        outgoingMap.set(from, (outgoingMap.get(from) || 0) + 1);
        incomingMap.set(to, (incomingMap.get(to) || 0) + 1);

        if (fromDir !== toDir) {
            outgoingExternalMap.set(from, (outgoingExternalMap.get(from) || 0) + 1);
            incomingExternalMap.set(to, (incomingExternalMap.get(to) || 0) + 1);
        }
    }

    // Build impact map (supports object map or array)
    const impactMap = new Map();
    if (Array.isArray(impact)) {
        for (const it of impact) {
            const id = normalizeId(it.file || it.filePath || it.fileId || "");
            impactMap.set(id, it);
        }
    } else if (impact && typeof impact === "object") {
        for (const key of Object.keys(impact)) {
            impactMap.set(normalizeId(key), impact[key]);
        }
    }

    // Build cyclomatic complexity map
    const ccMap = new Map();
    if (cyclomaticComplexity && Array.isArray(cyclomaticComplexity.files)) {
        for (const f of cyclomaticComplexity.files) {
            const id = normalizeId(f.file || f.filePath || "");
            const summary = (f.metrics && f.metrics.summary) || { averageComplexity: 0, highestComplexity: 0, functionCount: 0 };
            ccMap.set(id, summary);
        }
    }

    // Count cycles per file
    const cyclesCountMap = new Map();
    for (const cycle of cycles) {
        const affected = cycle.affectedModules || cycle.path || [];
        for (const m of affected) {
            const id = normalizeId(m);
            cyclesCountMap.set(id, (cyclesCountMap.get(id) || 0) + 1);
        }
    }

    // Compute repository maxima for normalization
    let maxOutgoingExternal = 0;
    let maxAffectedCount = 0;
    let maxDirectDependents = 0;
    let maxAvgCC = 0;

    for (const node of nodes) {
        const id = normalizeId(node.id);
        const outgoingExternal = outgoingExternalMap.get(id) || 0;
        maxOutgoingExternal = Math.max(maxOutgoingExternal, outgoingExternal);

        const imp = impactMap.get(id) || {};
        const affectedCount = imp.affectedCount || 0;
        const directDependents = (imp.directDependents ? imp.directDependents.length : (node.dependents ? node.dependents.length : 0)) || 0;
        maxAffectedCount = Math.max(maxAffectedCount, affectedCount);
        maxDirectDependents = Math.max(maxDirectDependents, directDependents);

        const ccSummary = ccMap.get(id) || {};
        const avgCC = ccSummary.averageComplexity || 0;
        maxAvgCC = Math.max(maxAvgCC, avgCC);
    }

    // Avoid division-by-zero by using 1 as denominator when maxima are zero
    if (maxOutgoingExternal === 0) maxOutgoingExternal = 1;
    if (maxAffectedCount === 0) maxAffectedCount = 1;
    if (maxDirectDependents === 0) maxDirectDependents = 1;
    if (maxAvgCC === 0) maxAvgCC = 1;

    // Per-file hotspot calculation
    const files = [];

    for (const node of nodes) {
        const id = normalizeId(node.id);
        const outgoingEdges = outgoingMap.get(id) || 0;
        const incomingEdges = incomingMap.get(id) || 0;
        const outgoingExternalEdges = outgoingExternalMap.get(id) || 0;
        const incomingExternalEdges = incomingExternalMap.get(id) || 0;
        const imp = impactMap.get(id) || {};
        const affectedCount = imp.affectedCount || 0;
        const directDependents = imp.directDependents ? imp.directDependents.length : (node.dependents ? node.dependents.length : 0) || 0;
        const ccSummary = ccMap.get(id) || {};
        const avgCC = ccSummary.averageComplexity || 0;
        const highestCC = ccSummary.highestComplexity || 0;
        const cyclesCount = cyclesCountMap.get(id) || 0;

        const outgoingCoupling = outgoingEdges === 0 ? 0 : outgoingExternalEdges / outgoingEdges;
        const incomingCoupling = incomingEdges === 0 ? 0 : incomingExternalEdges / incomingEdges;
        const couplingScore = 0.7 * outgoingCoupling + 0.3 * incomingCoupling;

        const affectedNorm = affectedCount / maxAffectedCount;
        const dependentsNorm = directDependents / maxDirectDependents;
        const impactScore = 0.7 * affectedNorm + 0.3 * dependentsNorm;

        const complexityScore = avgCC / maxAvgCC;

        const cyclePenalty = Math.min(cyclesCount * 0.10, 0.40);

        const Wc = weights.coupling;
        const Wi = weights.impact;
        const Wk = weights.complexity;
        const Wcyc = weights.cycle;

        const hotspotRaw = clamp(Wc * couplingScore + Wi * impactScore + Wk * complexityScore + Wcyc * cyclePenalty, 0, 1);
        const hotspotScore = Math.round(hotspotRaw * 100);

        const contributions = {
            coupling: Number((Wc * couplingScore * 100).toFixed(2)),
            impact: Number((Wi * impactScore * 100).toFixed(2)),
            complexity: Number((Wk * complexityScore * 100).toFixed(2)),
            cycle: Number((Wcyc * cyclePenalty * 100).toFixed(2))
        };

        const reasonTags = [];
        if (couplingScore >= 0.6) reasonTags.push("high-coupling");
        if (impactScore >= 0.6) reasonTags.push("high-impact");
        if (complexityScore >= 0.6) reasonTags.push("complex");
        if (cyclePenalty > 0) reasonTags.push("in-cycle");

        files.push({
            id,
            hotspotScore,
            hotspotRaw: Number(hotspotRaw.toFixed(4)),
            components: {
                couplingScore: Number(couplingScore.toFixed(4)),
                impactScore: Number(impactScore.toFixed(4)),
                complexityScore: Number(complexityScore.toFixed(4)),
                cyclePenalty: Number(cyclePenalty.toFixed(4))
            },
            contributions,
            counts: {
                outgoingEdges,
                outgoingExternalEdges,
                incomingEdges,
                incomingExternalEdges,
                affectedCount,
                directDependents,
                avgCC,
                highestCC,
                cyclesCount
            },
            reasonTags
        });
    }

    // Sort files by hotspot score descending
    files.sort((a, b) => b.hotspotScore - a.hotspotScore);

    // Folder aggregation (by parent directory)
    const folderMap = new Map();
    for (const f of files) {
        const dir = dirMap.get(f.id) || getDirectory(f.id);
        if (!folderMap.has(dir)) folderMap.set(dir, { dir, count: 0, sum: 0, files: [] });
        const entry = folderMap.get(dir);
        entry.count += 1;
        entry.sum += f.hotspotRaw;
        entry.files.push(f);
    }

    const folders = [];
    for (const [dir, entry] of folderMap.entries()) {
        const folderRaw = entry.count ? (entry.sum / entry.count) : 0;
        const folderScore = Math.round(clamp(folderRaw, 0, 1) * 100);
        const topContributors = entry.files.slice().sort((a, b) => b.hotspotScore - a.hotspotScore).slice(0, topN).map((x) => ({ id: x.id, hotspotScore: x.hotspotScore }));
        const folderReasonTags = Array.from(new Set(entry.files.slice(0, topN).flatMap((f) => f.reasonTags)));

        folders.push({
            id: dir,
            displayName: dir,
            hotspotScore: folderScore,
            hotspotRaw: Number(folderRaw.toFixed(4)),
            files: entry.files.map((x) => ({ id: x.id, hotspotScore: x.hotspotScore })),
            topContributors,
            folderReasonTags
        });
    }

    folders.sort((a, b) => b.hotspotScore - a.hotspotScore);

    return { files, folders };
}

module.exports = {
    calculateHotspots
};
