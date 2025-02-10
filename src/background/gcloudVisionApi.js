/**
 * Request OCR from Google Cloud Vision API
 * @param {string} imageUrl - The URL of the image to request OCR from
 * @returns {Promise<string>} The text extracted from the image
 */
async function requestOCR(imageUrl) {
    try {
        const requestBody = getTextDetectionRequestBody(imageUrl);

        // Make the API request
        const response = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            }
        );

        if (!response.ok) {
            await throwError(response);
        }

        const data = await response.json();

        // Extract the text from the response
        const textAnnotations = data.responses[0]?.textAnnotations;
        const text = (textAnnotations && textAnnotations[0]?.description) || "";
        return text;
    } catch (error) {
        console.error("Error in OCR request:", error);
        throw error;
    }
}

function getTextDetectionRequestBody(imageUrl) {
    return {
        requests: [
            {
                image: {
                    source: {
                        imageUri: imageUrl,
                    },
                },
                features: [
                    {
                        type: "TEXT_DETECTION",
                    },
                ],
            },
        ],
    };
}

async function throwError(response) {
    const errorDetails = await response.json();
    if (errorDetails?.error) {
        throw new Error(
            `Image annotate request Error:` +
                ` ${errorDetails.error.status}(${errorDetails.error.code})` +
                ` - ${errorDetails.error.message}`
        );
    } else {
        throw new Error(
            `HTTP error! ${response.statusText}(${response.status})`
        );
    }
}

export { requestOCR };
