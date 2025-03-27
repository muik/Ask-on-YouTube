import { BackgroundActions } from "../../constants.ts";
import { getVideoThumbnailUrl } from "../../data.js";
import { Errors } from "../../errors.ts";
import { cleanupSuggestion } from "./autoComplete.js";
import { loadGeminiServiceAvailable } from "./geminiService.js";
import { clearCaptionPending } from "./questionDialog/caption.js";
import { createBackgroundElement, insertQuestionDialog } from "./questionDialog/dialogUI.js";
import {
    handleChromeError,
    handleResponseError,
    setInputError,
} from "./questionDialog/errorHandler.js";
import { repositionDialog } from "./questionDialog/positionManager.js";
import {
    cleanupQuestionOptions,
    clearRequestQuestionsPendingListener,
    loadQuestionOptions,
    resetQuestions,
} from "./questionDialog/questionOptions.jsx";
import { getTitleTokens, setTitleToken } from "./questionDialog/titleToken.js";

export const containerId = "dialog-container";
const dialogData = {};

export function getContainerElement() {
    return document.querySelector(`ytd-popup-container #${containerId}`);
}

export function getDialogData() {
    return dialogData;
}

export function getYouTubeLanguageCode() {
    const lang = document.querySelector("html").getAttribute("lang");
    return lang.split("-")[0] || "en";
}

export function showQuestionDialog(videoInfo) {
    try {
        dialogData.videoInfo = videoInfo;
        const containerElement =
            getContainerElement() ||
            insertQuestionDialog({
                onRequestButtonClick,
                onCloseButtonClick: hideQuestionDialog,
                onResize: repositionDialog,
            });
        containerElement.style.display = "block";
        containerElement.style.zIndex = 9999;

        const backgroundElement = createBackgroundElement({ onClick: hideQuestionDialog });
        document.body.insertAdjacentElement("beforeend", backgroundElement);

        setQuestionDialogContent(videoInfo);

        loadQuestionOptions(containerElement);
        loadGeminiServiceAvailable();
        loadDefaultQuestion(containerElement);
        repositionDialog();
    } catch (error) {
        if (error.message === "Extension context invalidated.") {
            throw Errors.EXTENSION_CONTEXT_INVALIDATED;
        }
        throw error;
    }
}

async function loadDefaultQuestion(containerElement) {
    try {
        const response = await chrome.runtime.sendMessage({
            action: BackgroundActions.GET_DEFAULT_QUESTION,
            langCode: getYouTubeLanguageCode(),
        });

        if (chrome.runtime.lastError) {
            console.error("setDefaultQuestion lastError:", chrome.runtime.lastError);
            setInputError(Errors.FAILED_TO_LOAD_DEFAULT_QUESTION);
            return;
        }

        if (response.error) {
            console.error("setDefaultQuestion Error:", response);
            setInputError(Errors.FAILED_TO_LOAD_DEFAULT_QUESTION);
            return;
        }

        if (!response.question) {
            console.error("No question found:", response);
            setInputError(Errors.FAILED_TO_LOAD_DEFAULT_QUESTION);
            return;
        }

        const inputElement = containerElement.querySelector("textarea.question-input");
        inputElement.setAttribute("placeholder", response.question);
    } catch (error) {
        handleChromeError(error);
    }
}

function setQuestionDialogContent(videoInfo) {
    const containerElement = getContainerElement();
    containerElement.setAttribute("video-id", videoInfo.id);

    const titleElement = containerElement.querySelector(".title");
    const captionElement = containerElement.querySelector(".video-info .caption");
    titleElement.innerHTML = "";
    captionElement.innerHTML = "";

    const titleTokens = getTitleTokens(videoInfo.title);
    titleTokens.forEach(setTitleToken(titleElement));

    const thumbnailElement = containerElement.querySelector("img.thumbnail");
    thumbnailElement.setAttribute("src", getVideoThumbnailUrl(videoInfo));

    // cursor focus on the input field
    setTimeout(() => {
        document.querySelector(`#${containerId} textarea.question-input`).focus();
    }, 100);
}

function onRequestButtonClick(event) {
    const buttonElement = event.target;
    const formElement = buttonElement.closest(".ytq-form");
    const containerElement = formElement.closest(`#${containerId}`);
    const inputElement = formElement.querySelector("textarea.question-input");
    const question = inputElement.value || inputElement.placeholder;
    const thumbnailElement = containerElement.querySelector("img.thumbnail");
    const videoInfo = {
        id: containerElement.getAttribute("video-id"),
        title: containerElement.querySelector(".title").textContent,
        caption: thumbnailElement.getAttribute("title") || null,
    };
    const target = "chatgpt";

    // chrome.i18n depends on the OS language, but the YouTube language is not always the same as the OS language.
    // Assume the user wants to ask the question in the YouTube language.
    const langCode = getYouTubeLanguageCode();

    // set loading state
    buttonElement.setAttribute("disabled", "");
    inputElement.setAttribute("disabled", "");
    setInputError({}, containerElement);

    try {
        chrome.runtime.sendMessage(
            {
                action: BackgroundActions.SET_PROMPT,
                target: target,
                videoInfo,
                question,
                langCode,
            },
            response => {
                onPromptSet(response);
                resetRequesting();
                pauseVideoPlayer();
            }
        );
    } catch (error) {
        handleChromeError(error, containerElement);
        resetRequesting(containerElement);
    }
}

function resetRequesting(containerElement = null) {
    containerElement = containerElement || getContainerElement();
    const inputElement = containerElement.querySelector("#contents textarea.question-input");
    const buttonElement = containerElement.querySelector("#contents button.question-button");
    buttonElement.removeAttribute("disabled");
    inputElement.removeAttribute("disabled");
}

function onPromptSet(response) {
    if (isQuestionDialogClosed()) {
        return;
    }

    if (handleResponseError(response)) {
        return;
    }

    window.open(response.targetUrl, "_blank");
    hideQuestionDialog();
}

export function isQuestionDialogClosed() {
    const containerElement = getContainerElement();
    return containerElement && containerElement.style.display === "none";
}

export function pauseVideoPlayer() {
    const videoPlayer = document.querySelector("video.html5-main-video");
    if (videoPlayer) {
        videoPlayer.pause();
    }
}

function hideQuestionDialog() {
    const containerElement = getContainerElement();
    containerElement.style.display = "none";

    const inputElement = containerElement.querySelector("#contents textarea.question-input");
    inputElement.value = "";
    inputElement.placeholder = "";

    const backgroundElement = document.querySelector("tp-yt-iron-overlay-backdrop");
    if (backgroundElement) {
        backgroundElement.remove();
    }

    const thumbnailElement = containerElement.querySelector("img.thumbnail");
    thumbnailElement.removeAttribute("src");
    thumbnailElement.removeAttribute("title");

    resetQuestions(containerElement);
    resetRequesting(containerElement);
    setInputError({}, containerElement);
    delete dialogData.videoInfo;
    clearRequestQuestionsPendingListener();
    clearCaptionPending();
    cleanupSuggestion();
    cleanupQuestionOptions();
}
