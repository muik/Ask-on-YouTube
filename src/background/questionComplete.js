import { Errors } from "../errors.ts";
import { generateJsonContent } from "./geminiApi.js";
import { handleError } from "./handlers.ts";
import { getQuestionHistory } from "./questionHistory.ts";
import { getApiKeyRequired } from "./settingsLoader.js";
import { getHistoryText } from "./suggestQuestions.js";

/**
 * Get the question complete
 * @param {Object} request - The request object
 * @param {Function} sendResponse - The send response function
 * @returns {Promise<Object>} - The response object
 */
export function getQuestionComplete(request, sendResponse) {
    const { questionStart, videoInfo } = request;
    if (!questionStart || !videoInfo) {
        console.error("Invalid request on getQuestionComplete:", request);
        handleError(sendResponse)(Errors.INVALID_REQUEST);
        return;
    }

    Promise.all([getQuestionHistory(), getApiKeyRequired()])
        .then(([history, apiKey]) =>
            requestQuestionComplete({
                questionStart,
                videoInfo,
                history,
                apiKey,
            })
        )
        .then(sendResponse)
        .catch(handleError(sendResponse));

    return true;
}

const systemInstruction = `You are an AI assistant designed to help users quickly **type a question sentence to ask what they are curious about or get desired information** from YouTube videos **before watching them**. You will complete question starts with a user typed a string, based on the video's title and thumbnail to help users **easily and quickly ask questions to satisfy their curiosity or find necessary information**.

Your response should include the following:
* **\`"questionComplete"\`: A string, a question full sentence. It should starts with a user typed a string exactly. These questions should be:
    * **Relevant:** Directly related to the content implied by the video title and thumbnail.
    * **Insightful for pre-viewing:** Help users quickly grasp the main topic, purpose, or key takeaways of the video *before* watching.
    * **Targeted for curiosity/information:** Address what a user might be curious about or what specific information they might want to know quickly.
    * **Naturally phrased:** Sound like questions a user would actually ask when trying to quickly understand a video's content *before watching*.
    * **Referenced by the user's question history**: Consider the user's past questions to suggest questions aligned with their likely pre-viewing interests and information needs.
}`;

const responseSchema = {
    type: "object",
    properties: {
        questionComplete: {
            type: "string",
            description:
                "A question full sentence. It should starts with a user typed a string.",
        },
    },
    required: ["questionComplete"],
};

const promptFormat = `The title of the youtube video: \`{title}\`
The caption of the youtube video: \`{caption}\`

Your task is to complete a full question sentence starts with \`{questionStart}\`.

The user's recent question history: \`\`\`
{history}
\`\`\``;

/**
 * Request the question complete
 * @param {Object} request - The request object
 * @param {string} request.questionStart - The question start
 * @param {Object} request.videoInfo - The video info
 * @param {Object} options - The options object
 * @param {Array} options.history - The history array
 * @param {string} options.apiKey - The api key
 * @returns {Promise<Object>} - The response object
 */
async function requestQuestionComplete({
    questionStart,
    videoInfo,
    history = [],
    apiKey = undefined,
}) {
    const historyInline = getHistoryText(history);

    const prompt = promptFormat
        .replace("{title}", videoInfo.title)
        .replace("{caption}", videoInfo.caption)
        .replace("{questionStart}", questionStart)
        .replace("{history}", historyInline);

    return await generateJsonContent(prompt, {
        systemInstruction,
        responseSchema,
        apiKey,
    });
}
