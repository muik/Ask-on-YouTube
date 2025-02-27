"use strict";

import {
    getDefaultQuestion,
    getLastQuestionOption,
    getQuestions,
} from "./background/questions.js";
import { getPrompt, setPrompt } from "./background/setPrompt.js";
import { loadSettings, updateSettings } from "./background/settingsLoader.js";
import {
    getQuestionMenuUsedBefore,
    setQuestionMenuUsedBefore,
} from "./background/usedBefore.js";
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

    if (request.action === BackgroundActions.GET_QUESTION_MENU_USED_BEFORE) {
        return getQuestionMenuUsedBefore(sendResponse);
    } else if (
        request.action === BackgroundActions.SET_QUESTION_MENU_USED_BEFORE
    ) {
        return setQuestionMenuUsedBefore(sendResponse);
    }

    if (request.action === BackgroundActions.SET_PROMPT) {
        return setPrompt(request, sendResponse);
    }

    if (request.action === BackgroundActions.GET_PROMPT) {
        return getPrompt(sendResponse);
    } else if (request.action === BackgroundActions.OPEN_SETTINGS_PAGE) {
        chrome.runtime.openOptionsPage();
    } else {
        console.error("Invalid action:", request);
        sendResponse({
            error: Errors.INVALID_REQUEST,
        });
    }
});
