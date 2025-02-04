"use strict";

import { LRUCache } from "./background/lruCache.js";
import {
    getChatGPTPrompt,
    getGeminiPrompt,
    loadTranscript,
} from "./background/prompt.js";

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
const settings = {};
const transcriptCache = new LRUCache(10);

// On Message
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message === "setPrompt") {
        console.debug("Received setPrompt request:", request);
        handleSetPromptRequest(request).then((result) => {
            if (result.prompt) {
                prompt = result.prompt;
                sendResponse({
                    status: "success",
                    message: "Prompt received.",
                });
            } else if (result.error) {
                sendResponse(result);
            } else {
                sendResponse({ error: { message: "No prompt received." } });
            }
        });

        // Returning true ensures the response is asynchronous
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
        sendResponse({ error: { message: "Invalid message." } });
    }
});

async function handleSetPromptRequest(request) {
    if (!request.videoInfo) {
        console.error("No video info received.");
        return { error: { message: "No video info received." } };
    }

    const videoInfo = request.videoInfo;

    if (request.target === "chatgpt") {
        let transcript;
        if (transcriptCache.has(videoInfo.id)) {
            transcript = transcriptCache.get(videoInfo.id);
            console.debug(
                `Using cached transcript for video ID: ${videoInfo.id}`
            );
        } else {
            transcript = await loadTranscript(videoInfo.id);
            transcriptCache.put(videoInfo.id, transcript);
            console.debug(`Cached transcript for video ID: ${videoInfo.id}`);
        }

        if (!transcript) {
            return {
                error: {
                    code: "TRANSCRIPT_NOT_FOUND",
                    message: "Transcript not found.",
                },
            };
        }

        const prompt = await getChatGPTPrompt(videoInfo, transcript, settings);
        return { prompt: prompt };
    } else if (request.target === "gemini") {
        const prompt = await getGeminiPrompt(videoInfo.id, settings);
        return { prompt: prompt };
    } else {
        console.error("Invalid target:", request.target);
        return {
            error: {
                code: "INVALID_TARGET",
                message: "Invalid target.",
            },
        };
    }
}
