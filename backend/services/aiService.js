const { GoogleGenAI } = require("@google/genai");

let aiInstance = null;

/**
 * Get or initialize the GoogleGenAI client instance.
 */
function getAiClient() {
    if (!process.env.GEMINI_API_KEY) {
        return null;
    }
    if (!aiInstance) {
        aiInstance = new GoogleGenAI();
    }
    return aiInstance;
}

/**
 * Check if the AI service is properly configured with an API key.
 * @returns {boolean}
 */
function isAiConfigured() {
    return Boolean(getAiClient());
}

/**
 * Generate plain text response using Gemini model.
 * @param {string|Array} contents - Prompt text or array of content parts
 * @param {string} [systemInstruction] - Optional system instruction
 * @param {Object} [options] - Optional config override (e.g. temperature, maxOutputTokens)
 * @returns {Promise<string>}
 */
async function generateText(contents, systemInstruction = null, options = {}) {
    const client = getAiClient();
    if (!client) {
        throw new Error("AI service is not configured. GEMINI_API_KEY not found.");
    }

    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const config = {
        ...options,
    };

    if (systemInstruction) {
        config.systemInstruction = systemInstruction;
    }

    try {
        const response = await client.models.generateContent({
            model: modelName,
            contents: contents,
            config: config,
        });

        return response.text || "";
    }
    catch (error) {
        console.error(`[aiService] Error in generateText (${modelName}):`, error.message || error);
        throw error;
    }
}

/**
 * Generate structured JSON response using Gemini model.
 * @param {string|Array} contents - Prompt text or array of content parts
 * @param {string} [systemInstruction] - Optional system instruction
 * @param {Object} [responseSchema] - Optional JSON schema for structured output
 * @param {Object} [options] - Optional config override
 * @returns {Promise<Object>}
 */
async function generateJSON(contents, systemInstruction = null, responseSchema = null, options = {}) {
    const client = getAiClient();
    if (!client) {
        throw new Error("AI service is not configured. GEMINI_API_KEY not found.");
    }

    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const config = {
        responseMimeType: "application/json",
        ...options,
    };

    if (systemInstruction) {
        config.systemInstruction = systemInstruction;
    }

    if (responseSchema) {
        config.responseSchema = responseSchema;
    }

    try {
        const response = await client.models.generateContent({
            model: modelName,
            contents: contents,
            config: config,
        });

        const rawText = response.text || "{}";
        try {
            return JSON.parse(rawText);
        } catch (parseError) {
            console.error("[aiService] Failed to parse JSON response:", rawText);
            throw new Error("AI returned malformed JSON response.");
        }
    }
    catch (error) {
        console.error(`[aiService] Error in generateJSON (${modelName}):`, error.message || error);
        throw error;
    }
}

module.exports = {
    getAiClient,
    isAiConfigured,
    generateText,
    generateJSON,
};
