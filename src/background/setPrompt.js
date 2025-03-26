"use strict";
import Config from "../config.js";
import { Targets } from "../constants.js";
import { validateVideoInfo } from "../data.js";
import { Errors } from "../errors.js";
import { handleError } from "./handlers.js";
import { LRUCache } from "./lruCache.js";
import { loadTranscript } from "./prompt.js";
import { getDefaultQuestion, saveQuestionHistory } from "./questionHistory.js";

const transcriptCache = new LRUCache(10);
let promptDataTemp = "";

export function getPrompt(sendResponse) {
    sendResponse({ promptData: promptDataTemp });
    promptDataTemp = ""; // Reset prompt
}

export function setPrompt(request, sendResponse) {
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

async function processSetPrompt({ videoInfo, target, question, langCode }) {
    validateVideoInfo(videoInfo);

    if (target === Targets.CHATGPT) {
        const transcript = await getTranscriptCached(videoInfo.id, langCode);
        if (!transcript) {
            return {
                error: Errors.TRANSCRIPT_NOT_FOUND,
            };
        }

        if (!question) {
            question = await getDefaultQuestion();
        }

        const promptData = {
            videoInfo,
            transcript,
            question,
            langCode,
        };
        return {
            promptData,
            response: { targetUrl: getTargetUrl(target) },
        };
    } else if (target === Targets.GEMINI) {
        const transcript = await getTranscriptCached(videoInfo.id);
        if (!question) {
            question = await getDefaultQuestion();
        }

        const promptData = {
            videoInfo,
            transcript,
            question,
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

async function getTranscriptCached(videoId, langCode) {
    const cacheKey = `${videoId}-${langCode}`;
    if (transcriptCache.has(cacheKey)) {
        const transcript = transcriptCache.get(cacheKey);
        console.debug(`Using cached transcript for video ID: ${videoId} and langCode: ${langCode}`);
        return transcript;
    }

    const transcript = await loadTranscript(videoId, langCode);
    transcriptCache.put(cacheKey, transcript);
    console.debug(`Cached transcript for video ID: ${videoId} and langCode: ${langCode}`);
    return transcript;
}

function getTargetUrl(target) {
    let url;
    if (target === Targets.CHATGPT) {
        url = "https://chatgpt.com/";
    } else if (target === Targets.GEMINI) {
        url = "https://gemini.google.com/app";
    } else {
        throw new Error("Invalid target", { code: "INVALID_TARGET" });
    }
    return `${url}?ref=${Config.REF_CODE}`;
}

function handleSetPromptResult(sendResponse) {
    return result => {
        if (result.error) {
            throw result.error;
        }
        if (!result.promptData) {
            throw new Error("No prompt data provided in response");
        }

        promptDataTemp = result.promptData;
        sendResponse(result.response);
    };
}
