import { Errors } from "../errors.js";
import { generateJsonContent } from "./geminiApi.js";
import { handleError } from "./handlers.js";
import { getApiKeyRequired } from "./settingsLoader.js";

export function getCaption(request, sendResponse) {
    const { imageUrl, imageData } = request;
    if (!imageUrl && !imageData) {
        console.error("imageUrl or imageData is required");
        handleError(sendResponse)(Errors.INVALID_REQUEST);
        return;
    }

    getApiKeyRequired()
        .then((apiKey) => requestCaption({ imageUrl, imageData, apiKey }))
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
 * @param {string} request.imageData - The image data
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
