import { BackgroundActions } from "../../constants.js";
import { getVideoThumbnailUrl } from "../../data.js";
import { Errors } from "../../errors.js";
import { initAutoComplete } from "./autoComplete.js";
import { loadGeminiServiceAvailable } from "./geminiService.js";
import { loadCaption } from "./questionDialog/caption.js";
import { getQuestionHtml } from "./questionDialog/html.js";
import {
    loadQuestionOptions,
    resetQuestions,
    setQuestionOptionsView,
} from "./questionDialog/questionOptions.js";
import { getTitleTokens, setTitleToken } from "./questionDialog/titleToken.js";

export const containerId = "dialog-container";
const dialogData = {};

export function getContainerElement() {
    return document.querySelector(`ytd-popup-container #${containerId}`);
}

export function getDialogData() {
    return dialogData;
}

export function showQuestionDialog(videoInfo) {
    dialogData.videoInfo = videoInfo;
    const containerElement = getContainerElement() || insertQuestionDialog();
    containerElement.style.display = "block";
    containerElement.style.zIndex = 9999;

    const backgroundElement = createBackgroundElement();
    document.body.insertAdjacentElement("beforeend", backgroundElement);

    setQuestionDialogContent(videoInfo);

    loadQuestionOptions(containerElement);
    loadGeminiServiceAvailable();
    loadDefaultQuestion();
    repositionDialog();
}

function createBackgroundElement() {
    const element = document.createElement("tp-yt-iron-overlay-backdrop");
    element.setAttribute("opened", "");
    element.classList.add("opened");

    // close the dialog when the user clicks the background
    element.addEventListener("click", () => {
        hideQuestionDialog();
    });

    return element;
}

async function loadDefaultQuestion() {
    try {
        const response = await chrome.runtime.sendMessage({
            action: BackgroundActions.GET_DEFAULT_QUESTION,
        });

        if (chrome.runtime.lastError || response.error) {
            console.error("setDefaultQuestion Error:", response);
            setInputError(Errors.FAILED_TO_LOAD_DEFAULT_QUESTION);
            return;
        }

        if (!response.question) {
            console.error("No question found:", response);
            setInputError(Errors.FAILED_TO_LOAD_DEFAULT_QUESTION);
            return;
        }

        const inputElement = getContainerElement().querySelector(
            "textarea.question-input"
        );
        inputElement.setAttribute("placeholder", response.question);
    } catch (error) {
        if (error.message === "Extension context invalidated.") {
            setInputError(Errors.EXTENSION_CONTEXT_INVALIDATED);
        } else {
            console.error("loadDefaultQuestion Error:", error);
            setInputError(Errors.FAILED_TO_LOAD_DEFAULT_QUESTION);
        }
    }
}

function setQuestionDialogContent(videoInfo) {
    const containerElement = getContainerElement();
    containerElement.setAttribute("video-id", videoInfo.id);

    const inputElement = containerElement.querySelector(
        "textarea.question-input"
    );
    const titleElement = containerElement.querySelector(".title");
    const captionElement = containerElement.querySelector(
        ".video-info .caption"
    );
    titleElement.innerHTML = "";
    captionElement.innerHTML = "";

    const titleTokens = getTitleTokens(videoInfo.title);
    titleTokens.forEach(setTitleToken(titleElement, inputElement));

    const thumbnailElement = containerElement.querySelector("img.thumbnail");
    thumbnailElement.setAttribute("src", getVideoThumbnailUrl(videoInfo));

    // cursor focus on the input field
    setTimeout(() => {
        document
            .querySelector(`#${containerId} textarea.question-input`)
            .focus();
    }, 100);
}

export function setCaption(caption) {
    if (isQuestionDialogClosed() || dialogData.videoInfo.caption) {
        return;
    }

    dialogData.videoInfo.caption = caption;
    const containerElement = getContainerElement();
    const thumbnailElement = containerElement.querySelector(
        ".video-info img.thumbnail"
    );
    const captionElement = containerElement.querySelector(
        ".video-info .caption"
    );

    thumbnailElement.setAttribute("title", caption);
    captionElement.textContent = caption;
}

export function textToInputClickListener(e) {
    e.preventDefault();
    const text = e.target.textContent
        .replace(/\n/g, " ")
        .replace("  ", ", ")
        .trim();
    if (text) {
        const containerElement = e.target.closest(`#${containerId}`);
        const inputElement = containerElement.querySelector(
            "textarea.question-input"
        );
        inputElement.value = text;

        // focus on the input field, and move the cursor to the end of the text
        inputElement.focus();
        inputElement.setSelectionRange(text.length, text.length);
        inputElement.dispatchEvent(new Event("input"));
    }
}

function insertQuestionDialog() {
    document
        .querySelector("ytd-popup-container")
        .insertAdjacentHTML("beforeend", getQuestionHtml());

    const containerElement = getContainerElement();
    const thumbnailElement = containerElement.querySelector("img.thumbnail");
    thumbnailElement.addEventListener("load", loadCaption);

    // request button click event
    const requestButton = containerElement.querySelector(
        "#contents button.question-button"
    );
    requestButton.addEventListener("click", onRequestButtonClick);

    // enter key event on the input field
    const inputElement = containerElement.querySelector(
        "#contents textarea.question-input"
    );
    inputElement.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            requestButton.click();
        }
    });

    // caption text click event
    const captionElement = containerElement.querySelector(
        ".video-info .caption"
    );
    captionElement.addEventListener("click", textToInputClickListener);

    setQuestionOptionsView(containerElement);

    // close the dialog when the user clicks the close button
    const closeButton = containerElement.querySelector("#close-button");
    closeButton.addEventListener("click", hideQuestionDialog);

    // close the dialog when the user clicks outside of it or presses escape key
    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            hideQuestionDialog();
        }
    });

    // reposition the dialog when the window is resized
    window.addEventListener("resize", () => {
        repositionDialog();
    });

    initAutoComplete(inputElement);

    return containerElement;
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
    const lang = document.querySelector("html").getAttribute("lang");
    const langCode = lang.split("-")[0] || "en";

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
            (response) => {
                onPromptSet(response);
                resetRequesting();
            }
        );
    } catch (error) {
        if (error.message === "Extension context invalidated.") {
            setInputError(Errors.EXTENSION_CONTEXT_INVALIDATED);
        } else {
            console.error("sendMessage setPrompt Error:", error);
            setInputError(error, containerElement);
        }
        resetRequesting(containerElement);
    }
}

function resetRequesting(containerElement = null) {
    containerElement = containerElement || getContainerElement();
    const inputElement = containerElement.querySelector(
        "#contents textarea.question-input"
    );
    const buttonElement = containerElement.querySelector(
        "#contents button.question-button"
    );
    buttonElement.removeAttribute("disabled");
    inputElement.removeAttribute("disabled");
}

function setInputError(
    { message = "", type = "error" },
    containerElement = null
) {
    containerElement = containerElement || getContainerElement();
    const inputErrorElement = containerElement.querySelector(
        "#question-input-error"
    );
    inputErrorElement.textContent = message;
    inputErrorElement.setAttribute("type", type);
}

function onPromptSet(response) {
    if (isQuestionDialogClosed()) {
        return;
    }

    if (chrome.runtime.lastError) {
        console.error(
            "onPromptSet chrome.runtime.lastError:",
            chrome.runtime.lastError.message
        );
        setInputError({ message: Errors.UNKNOWN_ERROR.message });
        return;
    }

    if (response.error) {
        const { code, message } = response.error;
        const error = Errors[code];
        if (error) {
            setInputError(error);
        } else {
            console.error("onPromptSet Response Error:", response.error);
            setInputError({ message });
        }
        return;
    }

    if (!response.targetUrl) {
        console.error(
            "onPromptSet Invalid Response - targetUrl is not set. response:",
            response
        );
        setInputError({ message: "Invalid response, please try again later." });
        return;
    }

    window.open(response.targetUrl, "_blank");

    hideQuestionDialog();
}

/**
 * Set dialog position in the center of the screen
 */
function repositionDialog() {
    const containerElement = getContainerElement();
    if (!containerElement || containerElement.style.display == "none") {
        return;
    }

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const dialogWidth = containerElement.offsetWidth;
    const dialogHeight = Math.max(containerElement.offsetHeight, 501);
    const dialogX = (screenWidth - dialogWidth) / 2;
    const dialogY = (screenHeight - dialogHeight) / 2.2;
    containerElement.style.left = `${dialogX}px`;
    containerElement.style.top = `${dialogY}px`;

    // set z-index to the highest possible value
    const zIndexElements = document.querySelectorAll("[style*='z-index']");
    const highestZIndex =
        Math.max(
            ...Array.from(zIndexElements).map((element) =>
                parseInt(element.style.zIndex)
            )
        ) || 2200;

    const backdropElement = document.querySelector(
        "tp-yt-iron-overlay-backdrop"
    );
    backdropElement.style.zIndex = highestZIndex + 1;
    containerElement.style.zIndex = highestZIndex + 2;
}

function isQuestionDialogClosed() {
    const containerElement = getContainerElement();
    return containerElement && containerElement.style.display === "none";
}

function hideQuestionDialog() {
    const containerElement = getContainerElement();
    containerElement.style.display = "none";

    const inputElement = containerElement.querySelector(
        "#contents textarea.question-input"
    );
    inputElement.value = "";
    inputElement.placeholder = "";

    const backgroundElement = document.querySelector(
        "tp-yt-iron-overlay-backdrop"
    );
    if (backgroundElement) {
        backgroundElement.remove();
    }

    resetQuestions(containerElement);
    resetRequesting(containerElement);
    setInputError({}, containerElement);
    delete dialogData.videoInfo;
}
