import { Errors } from "../errors.js";
import { generateJsonContent } from "./geminiApi.js";
import { handleError } from "./handlers.js";
import { LRUCache } from "./lruCache.js";
import { getApiKeyRequired } from "./settingsLoader.js";

// Cache for storing captions with a capacity of 30 entries
const captionCache = new LRUCache(30);

export function getCaption(request, sendResponse) {
    const { imageUrl, imageData } = request;
    if (!imageUrl) {
        console.error("imageUrl is required");
        handleError(sendResponse)(Errors.INVALID_REQUEST);
        return;
    }

    if (captionCache.has(imageUrl)) {
        sendResponse(captionCache.get(imageUrl));
        return;
    }

    getApiKeyRequired()
        .then((apiKey) => requestCaption({ imageUrl, imageData, apiKey }))
        .then((response) => {
            captionCache.put(imageUrl, response);
            return response;
        })
        .then(sendResponse)
        .catch(handleError(sendResponse));

    return true;
}

const prompt = `Given this image is a thumbnail of a youtube video. Extract text from the image. If the image does not contain any text, return an empty string.`;
const responseSchema = {
    type: "object",
    properties: {
        caption: { type: "string" },
    },
    required: ["caption"],
};

/**
 * Request to extract caption of an image from Gemini
 * @param {Object} request - The request object
 * @param {string} request.imageUrl - The image URL
 * @param {string} [request.imageData] - Optional image data
 * @param {string} request.apiKey - The API key
 * @returns {Promise<Object>} - The caption
 */
async function requestCaption({ imageUrl, imageData, apiKey }) {
    return await generateJsonContent(prompt, {
        imageUrl,
        imageData,
        responseSchema,
        apiKey,
    });
}
