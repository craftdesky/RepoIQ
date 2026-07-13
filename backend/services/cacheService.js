const fs = require("fs");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "..", "data");
const CACHE_FILE = path.join(CACHE_DIR, "ai_cache.json");

/**
 * Read the entire cache from disk.
 */
function readCache() {
    try {
        if (!fs.existsSync(CACHE_FILE)) return {};
        const raw = fs.readFileSync(CACHE_FILE, "utf-8");
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

/**
 * Write the entire cache to disk.
 */
function writeCache(cache) {
    try {
        if (!fs.existsSync(CACHE_DIR)) {
            fs.mkdirSync(CACHE_DIR, { recursive: true });
        }
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
    } catch (err) {
        console.error("[cacheService] Failed to write cache:", err.message);
    }
}

/**
 * Get a cached entry.
 * @param {string} repoKey - The repository identifier (path or URL).
 * @param {string} featureKey - The feature + parameter key (e.g. "summary", "onboarding_Junior_General Exploration_Full-Stack").
 * @returns {object|null} The cached data, or null if not found.
 */
function getCache(repoKey, featureKey) {
    const cache = readCache();
    return cache[repoKey]?.[featureKey] ?? null;
}

/**
 * Set a cached entry.
 * @param {string} repoKey - The repository identifier.
 * @param {string} featureKey - The feature + parameter key.
 * @param {object} data - The data to cache.
 */
function setCache(repoKey, featureKey, data) {
    const cache = readCache();
    if (!cache[repoKey]) cache[repoKey] = {};
    cache[repoKey][featureKey] = {
        ...data,
        _cachedAt: new Date().toISOString()
    };
    writeCache(cache);
}

/**
 * Clear all cached entries for a specific repository.
 */
function clearRepoCache(repoKey) {
    const cache = readCache();
    delete cache[repoKey];
    writeCache(cache);
}

/**
 * Clear the entire cache.
 */
function clearAllCache() {
    writeCache({});
}

module.exports = {
    getCache,
    setCache,
    clearRepoCache,
    clearAllCache
};
