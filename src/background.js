"use strict";

import { LRUCache } from "./background/lruCache.js";
import { saveQuestionHistory } from "./background/questionHistory.js";
import { setPrompt } from "./background/setPrompt.js";
import { getSuggestedQuestions } from "./background/suggestQuestions.js";
import { validateVideoInfo } from "./data.js";

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
export const questionCache = new LRUCache(10);

// load settings from storage on startup
chrome.storage.sync.get(
    [
        "promptChatGPT",
        "promptGemini",
        "useExperimentalGemini",
        "googleCloudAPIKey",
    ],
    (result) => {
        for (const key in result) {
            settings[key] = result[key];
        }
        console.debug("Settings loaded:", settings);
    }
);

// On Message
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.debug("Received message:", request);

    if (request.message === "setPrompt") {
        validateVideoInfo(request.videoInfo);

        setPrompt({
            videoInfo: request.videoInfo,
            target: request.target,
            question: request.question,
        })
            .then(handleSetPromptResult(sendResponse))
            .catch(handleError(sendResponse));

        if (request.question) {
            saveQuestionHistory(request.videoInfo, request.question).catch(
                (error) => {
                    console.error("saveQuestionHistory error:", error);
                }
            );
        }

        // Returning true ensures the response is asynchronous
        return true;
    } else if (request.message === "getSuggestedQuestions") {
        validateVideoInfo(request.videoInfo);

        getSuggestedQuestions(request.videoInfo, settings)
            .then(sendResponse)
            .catch(handleError(sendResponse));
        return true;
    }

    if (request.message === "getPrompt") {
        sendResponse({ prompt: promptTemp });
        promptTemp = ""; // Reset prompt
    } else if (request.message === "settingsUpdated") {
        console.debug("Settings updated:", request);
        settings[request.key] = request.value;
        sendResponse({ status: "success", message: "Settings updated." });
    } else {
        sendResponse({
            error: { message: `Invalid message: ${request.message}` },
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

function handleError(sendResponse) {
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
