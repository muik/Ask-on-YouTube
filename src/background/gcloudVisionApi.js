/**
 * Request OCR from Google Cloud Vision API
 * @param {string} imageUrl - The URL of the image to request OCR from
 * @returns {Promise<string>} The text extracted from the image
 */
async function requestOCR(imageUrl) {
    try {
        // Prepare the request body
        const requestBody = {
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

export { requestOCR };
