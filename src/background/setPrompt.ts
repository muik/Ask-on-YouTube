"use strict";
import Config from "../config.js";
import { Targets } from "../constants.js";
import { validateVideoInfo } from "../data.js";
import { Errors } from "../errors.js";
import { handleError } from "./handlers.js";
import { getVideoPagePromptDataCached } from "./promptData/transcriptCache";
import { getDefaultQuestion, saveQuestionHistory } from "./questionHistory.js";
import { PromptData } from "../types";
import { SetPromptResponse, SetPromptRequest } from "../types/messages.js";
import { getCommentsPromptText } from "./promptData/comments.js";
import { formatInlineText } from "./promptData/format";

interface ProcessSetPromptResult {
    promptData?: PromptData;
    response?: SetPromptResponse;
    error?: {
        code?: string;
        message: string;
    };
}

let promptDataTemp: PromptData | null = null;

export function getPrompt(
    sendResponse: (response: { promptData: PromptData | null }) => void
): void {
    sendResponse({ promptData: promptDataTemp });
    promptDataTemp = null; // Reset prompt
}

export function setPrompt(
    request: SetPromptRequest,
    sendResponse: (response: SetPromptResponse) => void
): boolean {
    processSetPrompt(request)
        .then(handleSetPromptResult(sendResponse))
        .then(() => {
            if (request.question && request.type !== "placeholder") {
                saveQuestionHistory(request.videoInfo, request.question);
            }
        })
        .catch(handleError(sendResponse));

    return true;
}

async function processSetPrompt({
    videoInfo,
    target,
    question,
    langCode,
    inclusions,
    comments,
}: SetPromptRequest): Promise<ProcessSetPromptResult> {
    validateVideoInfo(videoInfo);

    if (target === Targets.CHATGPT) {
        const { transcript, description } = await getVideoPagePromptDataCached(
            videoInfo.id,
            langCode,
            inclusions.transcript
        );
        if (inclusions.transcript && !transcript) {
            return {
                error: Errors.TRANSCRIPT_NOT_FOUND,
            };
        }

        if (!question) {
            question = await getDefaultQuestion();
        }

        const promptData: PromptData = {
            videoInfo,
            transcript,
            description: description ? formatInlineText(description) : null,
            question,
            langCode,
        };

        if (inclusions.comments) {
            const commentsText = getCommentsPromptText(comments);
            promptData.commentsText = commentsText;
        }

        return {
            promptData,
            response: { targetUrl: getTargetUrl(target) },
        };
    } else if (target === Targets.GEMINI) {
        const { transcript, description } = await getVideoPagePromptDataCached(
            videoInfo.id,
            langCode,
            inclusions.transcript
        );
        if (!question) {
            question = await getDefaultQuestion();
        }

        const promptData: PromptData = {
            videoInfo,
            transcript,
            description,
            question,
            langCode,
        };

        return {
            promptData,
            response: { targetUrl: getTargetUrl(target) },
        };
    } else {
        console.error("Invalid target:", target);
        return {
            error: {
                code: "INVALID_TARGET",
                message: "Invalid target.",
            },
        };
    }
}

function getTargetUrl(target: Targets): string {
    let url: string;
    if (target === Targets.CHATGPT) {
        url = "https://chatgpt.com/";
    } else if (target === Targets.GEMINI) {
        url = "https://gemini.google.com/app";
    } else {
        throw new Error("Invalid target");
    }
    return `${url}?ref=${Config.REF_CODE}`;
}

function handleSetPromptResult(sendResponse: (response: SetPromptResponse) => void) {
    return (result: ProcessSetPromptResult) => {
        if (result.error) {
            throw result.error;
        }
        if (!result.promptData) {
            throw new Error("No prompt data provided in response");
        }

        promptDataTemp = result.promptData;
        sendResponse(result.response!);
    };
}
