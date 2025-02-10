"use strict";

import { handleSetPromptRequest } from "./background/handleSetPromptRequest.js";
import { LRUCache } from "./background/lruCache.js";
import { requestSuggestedQuestions } from "./background/requestQuestions.js";

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

let prompt = "";
export const settings = {};
export const transcriptCache = new LRUCache(10);

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
    if (request.message === "setPrompt") {
        console.debug("Received setPrompt request:", request);
        handleSetPromptRequest(request).then((result) => {
            if (result.prompt) {
                prompt = result.prompt;
                sendResponse(result.response);
            } else if (result.error) {
                sendResponse(result);
            } else {
                sendResponse({ error: { message: "No prompt received." } });
            }
        });

        // Returning true ensures the response is asynchronous
        return true;
    } else if (request.message === "getSuggestedQuestions") {
        console.debug("Received getSuggestedQuestions request:", request);
        handleGetSuggestedQuestionsRequest(request)
            .then((result) => {
                sendResponse(result);
            })
            .catch((error) => {
                console.error("getSuggestedQuestions error:", error);
                sendResponse({
                    error: {
                        message: error.message,
                        code: error.code,
                    },
                });
            });
        return true;
    }

    if (request.message === "getPrompt") {
        sendResponse({ prompt: prompt });
        prompt = ""; // Reset prompt
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

async function handleGetSuggestedQuestionsRequest(request) {
    const { videoInfo } = request;
    if (!videoInfo) {
        throw new Error("No videoInfo received.");
    }
    if (!settings.googleCloudAPIKey) {
        const error = new Error("googleCloudAPIKey settings not set.");
        error.code = "GOOGLE_CLOUD_API_KEY_NOT_SET";
        throw error;
    }

    const response = await requestSuggestedQuestions(videoInfo, {
        apiKey: settings.googleCloudAPIKey,
    });
    return response;
}
