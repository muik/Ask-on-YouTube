"use strict";

import Honeybadger from "@honeybadger-io/js";
import { getCaption } from "./background/caption.js";
import { getQuestionComplete } from "./background/questionComplete.js";
import { getQuestionCompleteAvailable } from "./background/questionCompleteAvailable.js";
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
import { honeybadgerConfig } from "./config.js";
import { BackgroundActions } from "./constants.js";
import { Errors } from "./errors.js";

Honeybadger.configure(honeybadgerConfig);

// On Chrome Install
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        const url = "https://muik.github.io/Ask-on-YouTube/pages/welcome.html";
        chrome.tabs.create({ url });
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
    } else if (request.action === BackgroundActions.GET_QUESTION_COMPLETE) {
        return getQuestionComplete(request, sendResponse);
    } else if (request.action === BackgroundActions.GET_DEFAULT_QUESTION) {
        return getDefaultQuestion(sendResponse);
    } else if (request.action === BackgroundActions.GET_LAST_QUESTION_OPTION) {
        return getLastQuestionOption(sendResponse);
    } else if (request.action === BackgroundActions.GET_CAPTION) {
        return getCaption(request, sendResponse);
    } else if (
        request.action === BackgroundActions.GET_QUESTION_COMPLETE_AVAILABLE
    ) {
        return getQuestionCompleteAvailable(sendResponse);
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
