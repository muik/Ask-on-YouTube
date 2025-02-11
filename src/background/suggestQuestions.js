import { GoogleGenerativeAIError } from "@google/generative-ai";
import { questionCache } from "../background.js";
import { generateJsonContent } from "./geminiApi.js";

export async function getSuggestedQuestions(videoInfo, settings) {
    if (!settings.googleCloudAPIKey) {
        const error = new Error("googleCloudAPIKey settings not set.");
        error.code = "GOOGLE_CLOUD_API_KEY_NOT_SET";
        throw error;
    }

    const cacheKey = videoInfo.id;
    if (questionCache.has(cacheKey)) {
        return questionCache.get(cacheKey);
    }

    const response = await requestSuggestedQuestions(videoInfo, {
        apiKey: settings.googleCloudAPIKey,
    });
    questionCache.put(cacheKey, response);

    return response;
}

const defaultResponseSchema = {
    type: "object",
    properties: {
        questions: { type: "array", items: { type: "string" } },
        caption: { type: "string" },
    },
    required: ["questions", "caption"],
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

const promptFormat = `Given this image is a thumbnail of a youtube video.
Your first task is to extract text from the image.

The title of the image: \`{title}\`

Your second task is to analyze the provided YouTube video title, thumbnail image, and the user's recent question history. Based on this information, you should suggest questions that a user might naturally ask to **quickly understand what the video is about, determine if it's relevant to their interests, or extract specific information without having to watch the entire video.**

The user's recent question history:
{history}`;

async function requestSuggestedQuestions(
    videoInfo,
    {
        history = [],
        promptText = null,
        systemInstruction = systemInstructions["default"],
        responseSchema = defaultResponseSchema,
        imageUrl = undefined,
        apiKey = undefined,
    } = {}
) {
    const { id, title } = videoInfo;
    if (id === undefined) {
        throw new Error("id is undefined");
    }
    if (title === undefined) {
        throw new Error("title is undefined");
    }

    // if imageUrl is not defined, use the default image url
    if (imageUrl === undefined) {
        imageUrl = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    }

    const historyInline = getHistoryText(history);
    const prompt =
        promptText ||
        promptFormat
            .replace("{title}", title)
            .replace("{history}", historyInline);

    console.debug("prompt:", prompt);
    try {
        const response = await generateJsonContent(prompt, {
            imageUrl,
            systemInstruction,
            responseSchema,
            apiKey,
        });
        return response;
    } catch (error) {
        if (error instanceof GoogleGenerativeAIError) {
            console.error(
                "Failed to generate suggested questions:",
                error.constructor.name,
                error
            );
        }
        throw error;
    }
}

export function getHistoryText(items) {
    if (!items || items.length === 0) {
        return "No history";
    }
    return items
        .map((h) => {
            const { videoInfo, question } = h;
            const { title, caption } = videoInfo;
            if (!title) {
                throw new Error("title is undefined");
            }
            if (caption === undefined) {
                throw new Error("caption is undefined");
            }
            if (question === undefined) {
                throw new Error("question is undefined");
            }
            return `- Title: \`${title}\`\n  Caption: \`${
                caption || ""
            }\`\n  Question: \`${question}\``;
        })
        .join("\n");
}
