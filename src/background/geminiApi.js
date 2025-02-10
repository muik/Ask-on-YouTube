import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "fs";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

const schema = {
    type: "object",
    properties: {
        questions: { type: "array", items: { type: "string" } },
        caption: { type: "string" },
    },
    required: ["questions", "caption"],
};

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
    responseSchema: schema,
};

const systemInstructions = {
    default: `You are an AI assistant designed to help users quickly **discover what they are curious about or get desired information** from YouTube videos **before watching them**. You will suggest questions based on the video's title and thumbnail to help users **easily and quickly ask questions to satisfy their curiosity or find necessary information**.

Your response should include the following:
* **\`"questions"\`: An array of strings, each representing a question in Korean. You should suggest between 1 and 3 questions. These questions should be:
    * **Relevant:** Directly related to the content implied by the video title and thumbnail.
    * **Insightful for pre-viewing:** Help users quickly grasp the main topic, purpose, or key takeaways of the video *before* watching.
    * **Targeted for curiosity/information:** Address what a user might be curious about or what specific information they might want to know quickly.
    * **Naturally phrased:** Sound like questions a user would actually ask when trying to quickly understand a video's content *before watching*.
    * **Referenced by the user's question history**: Consider the user's past questions to suggest questions aligned with their likely pre-viewing interests and information needs.
* **\`"caption"\`: A string containing the exact text visible in the thumbnail image, without any translation. If the thumbnail image does not contain any text, the value should be \`null\`.`,
};

async function uploadImageUrl(imageUrl) {
    const response = await fetch(imageUrl);
    if (!response.ok)
        throw new Error(`Failed to fetch image: ${response.statusText}`);

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const localImagePath = path.join(__dirname, "tempImage.jpg");
    fs.writeFileSync(localImagePath, imageBuffer);

    const uploadResult = await fileManager.uploadFile(localImagePath, {
        mimeType: "image/jpeg",
        displayName: imageUrl,
    });

    fs.unlinkSync(localImagePath);

    return uploadResult.file;
}

export async function requestSuggestedQuestions(
    prompt,
    imageUrl,
    systemInstruction = null
) {
    const files = [];
    if (imageUrl) {
        const startTime = Date.now();
        const file = await uploadImageUrl(imageUrl);
        console.debug(
            "upload image time sec:",
            (Date.now() - startTime) / 1000
        );
        files.push(file);
    }

    const request = [
        prompt.trim(),
        ...files.map((file) => ({
            fileData: {
                fileUri: file.uri,
                mimeType: file.mimeType,
            },
        })),
    ];

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-lite-preview-02-05",
        generationConfig,
        systemInstruction: (
            systemInstruction || systemInstructions["default"]
        ).trim(),
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
        console.error("Failed to parse JSON response:", error);
        throw new Error("Invalid JSON response");
    }
}
