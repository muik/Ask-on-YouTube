import {
    GoogleGenerativeAI,
    GoogleGenerativeAIFetchError,
} from "@google/generative-ai";
import { Buffer } from "buffer";
import { Errors } from "../errors.js";

const MODEL = "gemini-2.0-flash-lite";

// Gemini support PNG - image/png
const supportedImageTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/heic",
    "image/heif",
];

async function fetchImageData(imageUrl) {
    const imageResp = await fetch(imageUrl).then((response) =>
        response.arrayBuffer()
    );
    return {
        inlineData: {
            data: Buffer.from(imageResp).toString("base64"),
            mimeType: "image/jpeg",
        },
    };
}

async function getImageData(imageUrl) {
    const startTime = Date.now();
    const imageData = await fetchImageData(imageUrl);
    console.debug(
        "fetch image time sec:",
        (Date.now() - startTime) / 1000,
        "size:",
        imageData.inlineData.data.length
    );

    // if the image type is not image/jpeg, convert it to image/jpeg
    if (!supportedImageTypes.includes(imageData.inlineData.mimeType)) {
        console.error(
            "Not supported image type:",
            imageData.inlineData.mimeType
        );
        throw Errors.INVALID_REQUEST;
    }

    return imageData;
}

/**
 * Generate JSON content
 * @param {string} prompt - The prompt
 * @param {Object} options - The options object
 * @param {string} options.imageUrl - The image url
 * @param {string} options.imageData - The image data
 * @param {string} options.systemInstruction - The system instruction
 * @param {Object} options.responseSchema - The response schema
 * @param {string} options.apiKey - The gemini api key
 * @returns {Promise<Object>} - The response object
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
    const data = [];

    if (imageData) {
        data.push(imageData);
        console.debug("imageData size:", imageData.inlineData.data.length);
    } else if (imageUrl) {
        const imageData = await getImageData(imageUrl);
        data.push(imageData);
        console.debug("imageData size:", imageData.inlineData.data.length);
    }

    const request = [prompt.trim(), ...data];

    const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema,
    };

    if (!apiKey) {
        throw new Error("API key is required");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: MODEL,
        generationConfig,
        systemInstruction: systemInstruction ? systemInstruction.trim() : null,
    });

    let responseText = null;

    try {
        const startTime = Date.now();
        const result = await model.generateContent(request);
        console.debug(
            "token count:",
            result.response.usageMetadata.totalTokenCount
        );
        responseText = result.response.text();
        console.debug(
            "generate content request time sec:",
            (Date.now() - startTime) / 1000
        );
    } catch (error) {
        if (error instanceof GoogleGenerativeAIFetchError) {
            if (
                error.status === 400 &&
                error.errorDetails[0].reason === "API_KEY_INVALID"
            ) {
                console.debug("Invalid api key:", apiKey);
                throw Errors.GEMINI_API_KEY_NOT_VALID;
            }
            if (
                error.status === 400 &&
                error.message.includes("Provided image is not valid.")
            ) {
                console.info("the invalid image is:", imageData || imageUrl);
            } else {
                console.error(
                    `Failed to generate content - status: ${
                        error.status
                    }, statusText: ${error.statusText}, errorDetails: ${
                        error.errorDetails
                            ? JSON.stringify(error.errorDetails)
                            : ""
                    }, message: ${error.message}`
                );
            }
        } else {
            console.error(
                "Failed to generate content:",
                error.constructor.name,
                error
            );
        }
        throw error;
    }

    try {
        return JSON.parse(responseText);
    } catch (error) {
        console.warn("Failed to parse JSON response:", responseText, error);
        throw Errors.INVALID_RESPONSE;
    }
}

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
