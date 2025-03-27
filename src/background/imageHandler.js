import { Buffer } from "buffer";
import { Errors } from "../errors.js";

/**
 * Supported image MIME types for Gemini API
 * @type {string[]}
 */
const supportedImageTypes = ["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"];

/**
 * Fetches image data from a URL and converts it to base64
 * @param {string} imageUrl - The URL of the image to fetch
 * @returns {Promise<Object>} The image data in base64 format with mime type
 * @throws {Error} If the image cannot be fetched or is not a valid image
 */
async function fetchImageData(imageUrl) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
        throw new Error(`Invalid content type: ${contentType}`);
    }

    const imageResp = await response.arrayBuffer();
    return {
        inlineData: {
            data: Buffer.from(imageResp).toString("base64"),
            mimeType: contentType,
        },
    };
}

/**
 * Processes image data from a URL
 * @param {string} imageUrl - The URL of the image to process
 * @returns {Promise<Object>} The processed image data
 * @throws {Error} If the image type is not supported or processing fails
 */
export async function getImageData(imageUrl) {
    const startTime = Date.now();
    const imageData = await fetchImageData(imageUrl);
    console.debug(
        "fetch image time sec:",
        (Date.now() - startTime) / 1000,
        "size:",
        imageData.inlineData.data.length,
        "type:",
        imageData.inlineData.mimeType
    );

    if (!supportedImageTypes.includes(imageData.inlineData.mimeType)) {
        console.error("Not supported image type:", imageData.inlineData.mimeType);
        throw Errors.INVALID_REQUEST;
    }

    return imageData;
} 