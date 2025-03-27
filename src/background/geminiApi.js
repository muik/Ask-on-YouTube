import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from "@google/generative-ai";
import { Errors } from "../errors.js";
import { MODEL, generationConfig, validateGenerationConfig } from "./geminiConfig.js";
import { getImageData } from "./imageHandler.js";

/**
 * Handles Gemini API errors and maps them to application errors
 * @param {Error} error - The error to handle
 * @param {Object} context - Additional context for error handling
 * @param {Object} context.imageData - The image data that caused the error
 * @param {string} context.imageUrl - The image URL that caused the error
 * @throws {Error} The mapped application error
 */
function handleGeminiError(error, context = {}) {
    if (error instanceof GoogleGenerativeAIFetchError) {
        switch (error.status) {
            case 503:
                if (error.message.endsWith("The service is currently unavailable.")) {
                    throw Errors.GEMINI_API_UNAVAILABLE;
                } else if (error.message.endsWith("Deadline expired before operation could complete.")) {
                    throw Errors.GEMINI_API_TIMEOUT;
                }
                break;
            case 429:
                throw Errors.GEMINI_API_RATE_LIMIT;
            case 400:
                if (error.errorDetails?.[0]?.reason === "API_KEY_INVALID") {
                    console.debug("Invalid API key");
                    throw Errors.GEMINI_API_KEY_NOT_VALID;
                }
                if (error.message.includes("Provided image is not valid.")) {
                    console.info("Invalid image:", context.imageData || context.imageUrl);
                }
                break;
            default:
                console.error(
                    `Failed to generate content - status: ${error.status}, statusText: ${
                        error.statusText
                    }, errorDetails: ${
                        error.errorDetails ? JSON.stringify(error.errorDetails) : ""
                    }, message: ${error.message}`
                );
        }
    } else {
        console.error("Failed to generate content:", error.constructor.name, error);
    }
    throw error;
}

/**
 * Generate JSON content using the Gemini API
 * @param {string} prompt - The prompt to send to the API
 * @param {Object} options - The options object
 * @param {string} [options.imageUrl] - The URL of an image to include
 * @param {Object} [options.imageData] - Pre-fetched image data
 * @param {string} [options.systemInstruction] - System instruction for the model
 * @param {Object} [options.responseSchema] - Schema for the expected response
 * @param {string} options.apiKey - The Gemini API key
 * @returns {Promise<Object>} The parsed JSON response
 * @throws {Error} Various application errors
 */
export async function generateJsonContent(
    prompt,
    {
        imageUrl = null,
        imageData = null,
        systemInstruction = null,
        responseSchema = null,
        apiKey = undefined,
    }
) {
    if (!apiKey) {
        throw new Error("API key is required");
    }

    const data = [];

    if (imageData) {
        data.push(imageData);
        console.debug("imageData size:", imageData.inlineData.data.length);
    } else if (imageUrl) {
        const fetchedImageData = await getImageData(imageUrl);
        data.push(fetchedImageData);
        console.debug("imageData size:", fetchedImageData.inlineData.data.length);
    }

    const request = [prompt.trim(), ...data];

    const config = {
        ...generationConfig,
        responseSchema,
    };
    validateGenerationConfig(config);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: MODEL,
        generationConfig: config,
        systemInstruction: systemInstruction ? systemInstruction.trim() : null,
    });

    let responseText = null;

    try {
        const startTime = Date.now();
        const result = await model.generateContent(request);
        console.debug("token count:", result.response.usageMetadata.totalTokenCount);
        responseText = result.response.text();
        console.debug("generate content request time sec:", (Date.now() - startTime) / 1000);
    } catch (error) {
        handleGeminiError(error, { imageData, imageUrl });
    }

    try {
        return JSON.parse(responseText);
    } catch (error) {
        console.warn("Failed to parse JSON response:", responseText, error);
        throw Errors.INVALID_RESPONSE;
    }
}

/**
 * Check if the Gemini API is available
 * @param {string} apiKey - The Gemini API key to check
 * @returns {Promise<boolean>} Whether the API is available
 * @throws {Error} If the API key is not provided
 */
export async function isGeminiAvailable(apiKey) {
    if (!apiKey) {
        throw new Error("API key is required");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}?key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.debug(
                "Gemini API check failed:",
                response.status,
                response.statusText,
                await response.json()
            );
            return false;
        }
        return true;
    } catch (error) {
        console.error("Failed to check Gemini API availability:", error);
        return false;
    }
}
