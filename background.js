"use strict";

console.log("connected...");
const onInstallURL = "https://glasp.co/youtube-summary";

// On Chrome Install
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        chrome.tabs.create({ url: onInstallURL });
    }
});

let prompt = "";

// On Message
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message === "setPrompt") {
        prompt = request.prompt;
        sendResponse({ status: "success", data: "Prompt received." });
    } else if (request.message === "getPrompt") {
        sendResponse({ prompt: prompt });
        prompt = ""; // Reset prompt
    }

    // Returning true ensures the response is asynchronous
    return true;
});