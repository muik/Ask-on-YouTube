"use strict";

import { handleError } from "./background/handlers.js";
import { saveQuestionHistory } from "./background/questionHistory.js";
import {
    getDefaultQuestion,
    getLastQuestionOption,
    getQuestions
} from "./background/questions.js";
import { setPrompt } from "./background/setPrompt.js";
import { loadSettings, updateSettings } from "./background/settingsLoader.js";
import { BackgroundActions } from "./constants.js";
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

// load settings from storage on startup
loadSettings();
chrome.storage.onChanged.addListener(updateSettings);

// On Message
// Returning true ensures the response is asynchronous
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.debug("Received message:", request);

    if (request.action === BackgroundActions.GET_QUESTIONS) {
        return getQuestions(request, sendResponse);
    } else if (request.action === BackgroundActions.GET_DEFAULT_QUESTION) {
        return getDefaultQuestion(sendResponse);
    } else if (request.action === BackgroundActions.GET_LAST_QUESTION_OPTION) {
        return getLastQuestionOption(sendResponse);
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
            saveQuestionHistory(request.videoInfo, request.question);
        }

        return true;
    }

    if (request.action === BackgroundActions.GET_PROMPT) {
        sendResponse({ prompt: promptTemp });
        promptTemp = ""; // Reset prompt
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
        if (result.error) {
            throw result.error;
        }
        if (!result.prompt) {
            throw new Error("No prompt provided in response");
        }

        promptTemp = result.prompt;
        sendResponse(result.response);
    };
}
