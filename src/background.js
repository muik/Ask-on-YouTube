"use strict";

import { LRUCache } from "./background/lruCache.js";
import { saveQuestionHistory } from "./background/questionHistory.js";
import { getQuestions } from "./background/questions.js";
import { setPrompt } from "./background/setPrompt.js";
import { BackgroundActions, StorageKeys } from "./constants.js";
import { Errors } from "./errors.js";

console.log("connected...");
// const onInstallURL = "https://glasp.co/youtube-summary";

// On Chrome Install
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        // TODO replace this url
        // chrome.tabs.create({ url: onInstallURL });
    }
});

// On Chrome Icon Click
chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});

let promptTemp = "";
export const settings = {};
export const transcriptCache = new LRUCache(10);
// load settings from storage on startup
chrome.storage.sync.get(
    [StorageKeys.GEMINI_API_KEY, StorageKeys.LAST_QUESTION_OPTION],
    (result) => {
        Object.keys(result).forEach((key) => {
            settings[key] = result[key];
        });
        console.debug("Settings loaded:", settings);
    }
);

// On Message
// Returning true ensures the response is asynchronous
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.debug("Received message:", request);

    if (request.action === BackgroundActions.GET_QUESTIONS) {
        return getQuestions(request, sendResponse);
    }

    if (request.action === BackgroundActions.SET_PROMPT) {
        setPrompt({
            videoInfo: request.videoInfo,
            target: request.target,
            question: request.question,
        })
            .then(handleSetPromptResult(sendResponse))
            .catch(handleError(sendResponse));

        if (request.question && request.type !== "placeholder") {
            saveQuestionHistory(request.videoInfo, request.question).catch(
                (error) => {
                    console.error("saveQuestionHistory error:", error);
                }
            );
        }

        return true;
    }

    if (request.action === BackgroundActions.GET_PROMPT) {
        sendResponse({ prompt: promptTemp });
        promptTemp = ""; // Reset prompt
    } else if (request.action === BackgroundActions.SETTINGS_UPDATED) {
        console.debug("Settings updated:", request);
        settings[request.key] = request.value;
        sendResponse({ status: "success", message: "Settings updated." });
    } else if (request.action === BackgroundActions.OPEN_SETTINGS_PAGE) {
        chrome.runtime.openOptionsPage();
    } else {
        console.error("Invalid action:", request);
        sendResponse({
            error: Errors.INVALID_REQUEST,
        });
    }
});

function handleSetPromptResult(sendResponse) {
    return (result) => {
        if (result.prompt) {
            promptTemp = result.prompt;
            sendResponse(result.response);
        } else {
            const error =
                result.error || new Error("Internal server error: No prompt");
            handleError(sendResponse)(error);
        }
    };
}

export function handleError(sendResponse) {
    return (error) => {
        if (!error.code) {
            error.code = "UNKNOWN_ERROR";
            console.error("Unknown error:", error);
        }
        sendResponse({
            error: {
                message: error.message,
                code: error.code,
            },
        });
    };
}
