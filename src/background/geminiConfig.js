/**
 * The Gemini model to use for generation
 * @type {string}
 */
export const MODEL = "gemini-2.0-flash-lite";

/**
 * Default generation configuration for the Gemini API
 * @type {Object}
 * @property {number} temperature - Controls randomness in the output (0.0 to 1.0)
 * @property {number} topP - Controls diversity via nucleus sampling (0.0 to 1.0)
 * @property {number} topK - Controls diversity via top-k sampling (1 to 100)
 * @property {number} maxOutputTokens - Maximum number of tokens to generate
 * @property {string} responseMimeType - The expected response format
 */
export const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
};

/**
 * Validates the generation configuration
 * @param {Object} config - The configuration to validate
 * @throws {Error} If the configuration is invalid
 */
export function validateGenerationConfig(config) {
    if (config.temperature < 0 || config.temperature > 1) {
        throw new Error("Temperature must be between 0 and 1");
    }
    if (config.topP < 0 || config.topP > 1) {
        throw new Error("TopP must be between 0 and 1");
    }
    if (config.topK < 1 || config.topK > 100) {
        throw new Error("TopK must be between 1 and 100");
    }
    if (config.maxOutputTokens < 1) {
        throw new Error("MaxOutputTokens must be positive");
    }
} 