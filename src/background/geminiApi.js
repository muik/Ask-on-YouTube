import { GoogleGenerativeAI } from "@google/generative-ai";
import { Buffer } from "buffer";
import { Errors } from "../errors.js";

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

export async function generateJsonContent(
    prompt,
    {
        imageUrl = null,
        systemInstruction = null,
        responseSchema = null,
        apiKey = undefined,
    }
) {
    const data = [];

    if (imageUrl) {
        const startTime = Date.now();
        const imageData = await fetchImageData(imageUrl);
        console.debug("fetch image time sec:", (Date.now() - startTime) / 1000);
        data.push(imageData);
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

    const genAI = new GoogleGenerativeAI(
        apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY
    );
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-lite",
        generationConfig,
        systemInstruction: systemInstruction ? systemInstruction.trim() : null,
    });

    const startTime = Date.now();
    const result = await model.generateContent(request);
    console.debug(
        "token count:",
        result.response.usageMetadata.totalTokenCount
    );
    const responseText = result.response.text();
    console.debug(
        "generate content request time sec:",
        (Date.now() - startTime) / 1000
    );

    try {
        return JSON.parse(responseText);
    } catch (error) {
        console.warn("Failed to parse JSON response:", responseText, error);
        throw Errors.INVALID_RESPONSE;
    }
}
