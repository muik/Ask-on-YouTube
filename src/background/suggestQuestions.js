import { GoogleGenerativeAIFetchError } from "@google/generative-ai";
import Config from "../config.js";
import { validateVideoInfo } from "../data.js";
import { Errors } from "../errors.js";
import { generateJsonContent } from "./geminiApi.js";
import { LRUCache } from "./lruCache.js";
import { getQuestionHistory } from "./questionHistory.js";

const questionCache = new LRUCache(10);

export async function getSuggestedQuestions({ videoInfo, apiKey, language }) {
    validateVideoInfo(videoInfo);

    if (!apiKey) {
        throw Errors.GEMINI_API_KEY_NOT_SET;
    }

    const cacheKey = videoInfo.id;
    if (questionCache.has(cacheKey)) {
        return questionCache.get(cacheKey);
    }

    const history = await getQuestionHistory();
    const response = await requestSuggestedQuestions(videoInfo, {
        history,
        apiKey,

        // If no history, use the language from the user
        language: history.length === 0 ? language : undefined,
    });
    questionCache.put(cacheKey, response);

    return response;
}

const types = {
    image: {
        systemInstruction: `You are an AI assistant designed to help users quickly **discover what they are curious about or get desired information** from YouTube videos **before watching them**. You will suggest questions based on the video's title and thumbnail to help users **easily and quickly ask questions to satisfy their curiosity or find necessary information**.

Your response should include the following:
* **\`"questions"\`: An array of strings, each representing a question. You should suggest between 1 and ${Config.MAX_QUESTIONS_COUNT} questions. These questions should be:
    * **Relevant:** Directly related to the content implied by the video title and thumbnail.
    * **Insightful for pre-viewing:** Help users quickly grasp the main topic, purpose, or key takeaways of the video *before* watching.
    * **Targeted for curiosity/information:** Address what a user might be curious about or what specific information they might want to know quickly.
    * **Naturally phrased:** Sound like questions a user would actually ask when trying to quickly understand a video's content *before watching*.
    * **Referenced by the user's question history**: Consider the user's past questions to suggest questions aligned with their likely pre-viewing interests and information needs.
* **\`"caption"\`: A string containing the exact text visible in the thumbnail image, without any translation. If the thumbnail image does not contain any text, the value should be an empty string.`,

        promptFormat: `Given this image is a thumbnail of a youtube video.
Your first task is to extract text from the image.

The title of the youtube video: \`{title}\`

Your second task is to analyze the provided YouTube video title, thumbnail image, and the user's recent question history. Based on this information, you should suggest questions that a user might naturally ask to **quickly understand what the video is about, determine if it's relevant to their interests, or extract specific information without having to watch the entire video.**

The user's recent question history:
{history}

{postPrompt}`,
        responseSchema: {
            type: "object",
            properties: {
                questions: { type: "array", items: { type: "string" } },
                caption: { type: "string" },
            },
            required: ["questions", "caption"],
        },
    },
    caption: {
        systemInstruction: `You are an AI assistant designed to help users quickly **discover what they are curious about or get desired information** from YouTube videos **before watching them**. You will suggest questions based on the video's title and thumbnail to help users **easily and quickly ask questions to satisfy their curiosity or find necessary information**.

Your response should include the following:
* **\`"questions"\`: An array of strings, each representing a question. You should suggest between 1 and ${Config.MAX_QUESTIONS_COUNT} questions. These questions should be:
    * **Relevant:** Directly related to the content implied by the video title and thumbnail.
    * **Insightful for pre-viewing:** Help users quickly grasp the main topic, purpose, or key takeaways of the video *before* watching.
    * **Targeted for curiosity/information:** Address what a user might be curious about or what specific information they might want to know quickly.
    * **Naturally phrased:** Sound like questions a user would actually ask when trying to quickly understand a video's content *before watching*.
    * **Referenced by the user's question history**: Consider the user's past questions to suggest questions aligned with their likely pre-viewing interests and information needs.`,

        promptFormat: `The title of the youtube video: \`{title}\`
The subtitle of the youtube video: \`{subtitle}\`

Your task is to analyze the provided YouTube video title, thumbnail image, and the user's recent question history. Based on this information, you should suggest questions that a user might naturally ask to **quickly understand what the video is about, determine if it's relevant to their interests, or extract specific information without having to watch the entire video.**

The user's recent question history:
{history}

{postPrompt}`,
        responseSchema: {
            type: "object",
            properties: {
                questions: { type: "array", items: { type: "string" } },
            },
            required: ["questions"],
        },
    },
};

async function requestSuggestedQuestions(
    videoInfo,
    { history = [], apiKey = undefined, language = undefined } = {}
) {
    const { id, title, caption } = videoInfo;
    if (id === undefined) {
        throw new Error("id is undefined");
    }
    if (title === undefined) {
        throw new Error("title is undefined");
    }

    const historyInline = getHistoryText(history);
    const postPrompt = language ? `The user's language: ${language}` : "";

    let type = null;
    let imageUrl = null;
    let prompt = null;

    console.debug("caption:", caption);
    if (caption === undefined) {
        type = types.image;
        imageUrl = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
        prompt = type.promptFormat
            .replace("{title}", title)
            .replace("{history}", historyInline)
            .replace("{postPrompt}", postPrompt);
    } else {
        type = types.caption;
        prompt = type.promptFormat
            .replace("{title}", title)
            .replace("{subtitle}", caption)
            .replace("{history}", historyInline)
            .replace("{postPrompt}", postPrompt);
    }

    console.debug("prompt:", prompt);
    try {
        const response = await generateJsonContent(prompt, {
            imageUrl,
            systemInstruction: type.systemInstruction,
            responseSchema: type.responseSchema,
            apiKey,
        });
        return response;
    } catch (error) {
        handleError(error);
    }
}

function handleError(error) {
    if (error instanceof GoogleGenerativeAIFetchError) {
        if (
            error.status === 400 &&
            error.errorDetails[0].reason === "API_KEY_INVALID"
        ) {
            throw Errors.GEMINI_API_KEY_NOT_VALID;
        }
    }
    throw error;
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
            if (question === undefined) {
                throw new Error("question is undefined");
            }
            return `- Title: \`${title}\`\n  Caption: \`${
                caption || ""
            }\`\n  Question: \`${question}\``;
        })
        .join("\n");
}
