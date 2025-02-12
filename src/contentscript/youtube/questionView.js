import { Errors, Info, handleSendMessageError } from "../../errors.js";
import { getVideoInfoFromExtraOptions } from "./moreOptions.js";
import {
    getDialogBackgoundHtml,
    getQuestionHtml,
} from "./questionDialog/html.js";
import { getTitleTokens, setTitleToken } from "./questionDialog/titleToken.js";
import { showToastMessage } from "./toast.js";

export const containerId = "dialog-container";

export function showQuestionDialog(videoInfo) {
    let containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );
    if (!containerElement) {
        containerElement = insertQuestionDialog();
    } else {
        containerElement.style.display = "block";
    }

    document.body.insertAdjacentHTML("beforeend", getDialogBackgoundHtml());

    // close the dialog when the user clicks the background
    const backgroundElement = document.querySelector(
        "tp-yt-iron-overlay-backdrop"
    );
    backgroundElement.addEventListener("click", () => {
        hideQuestionDialog();
    });

    setQuestionDialogContent(videoInfo);

    containerElement
        .querySelectorAll(".question-options .title")
        .forEach((el) => {
            el.addEventListener("click", onQuestionOptionClick);
        });

    const selectedQuestionOption = containerElement
        .querySelector(".question-options .title.active")
        .getAttribute("data-option");

    requestQuestions(selectedQuestionOption, videoInfo);
}

function onQuestionOptionClick(e) {
    if (e.target.classList.contains("active")) {
        return;
    }

    e.target
        .closest(".question-options")
        .querySelector(".title.active")
        .classList.remove("active");
    e.target.classList.add("active");

    resetQuestions();

    const selectedQuestionOption = e.target.getAttribute("data-option");
    requestQuestions(selectedQuestionOption);
}

function requestQuestions(selectedQuestionOption, videoInfo = null) {
    showProgressSpinner();

    // set dialog position in the center of the screen
    repositionDialog();

    if (selectedQuestionOption === "recent") {
        requestRecentQuestions();
    } else if (selectedQuestionOption === "suggestions") {
        videoInfo = videoInfo || getVideoInfoFromExtraOptions();
        requestSuggestedQuestions(videoInfo);
    }
}

function resetQuestions() {
    const containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );
    containerElement.querySelector("ul.suggestions").innerHTML = "";

    // remove message
    const messageElement = containerElement.querySelector("p.message");
    messageElement.innerHTML = "";
    messageElement.removeAttribute("type");
}

function requestRecentQuestions() {
    try {
        chrome.runtime.sendMessage(
            { action: "getRecentQuestions" },
            (response) => {
                if (chrome.runtime.lastError || response.error) {
                    const error = chrome.runtime.lastError || response.error;
                    setError(error);
                } else {
                    console.debug("recent questions response:", response);
                    if (!response.history) {
                        console.error("recent questions response:", response);
                        setError(Errors.INVALID_RESPONSE);
                    } else if (response.history.length < 1) {
                        setError(Errors.NO_RECENT_QUESTIONS);
                    } else {
                        const questions = response.history.map(
                            (item) => item.question
                        );
                        setQuestions(questions);
                    }
                }
                hideProgressSpinner();
                repositionDialog();
            }
        );
    } catch (error) {
        if (!handleSendMessageError(error)) {
            setError(error);
        }
        hideProgressSpinner();
        repositionDialog();
    }
}

function requestSuggestedQuestions(videoInfo) {
    try {
        chrome.runtime.sendMessage(
            { message: "getSuggestedQuestions", videoInfo },
            (response) => {
                if (chrome.runtime.lastError || response.error) {
                    const error = chrome.runtime.lastError || response.error;
                    setError(error);
                } else {
                    console.debug("suggested questions response:", response);
                    setSuggestedQuestions(response);
                }
                hideProgressSpinner();
                repositionDialog();
            }
        );
    } catch (error) {
        if (!handleSendMessageError(error)) {
            setError(error);
        }
        hideProgressSpinner();
        repositionDialog();
    }
}

function showProgressSpinner() {
    const containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );
    const spinnerElement = containerElement.querySelector("#spinner");
    spinnerElement.removeAttribute("hidden");
    const paperSpinnerElement = spinnerElement.querySelector(
        "tp-yt-paper-spinner"
    );
    paperSpinnerElement.removeAttribute("aria-hidden");
    paperSpinnerElement.setAttribute("active", "");
}

function hideProgressSpinner() {
    const containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );
    const spinnerElement = containerElement.querySelector("#spinner");
    spinnerElement.setAttribute("hidden", "");
}

function setQuestionDialogContent(videoInfo) {
    const containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );

    containerElement.setAttribute("video-id", videoInfo.id);

    const inputElement = containerElement.querySelector("input[type='text']");
    const titleElement = containerElement.querySelector(".title");
    const captionElement = containerElement.querySelector(
        ".video-info .caption"
    );
    titleElement.innerHTML = "";
    captionElement.innerHTML = "";

    const titleTokens = getTitleTokens(videoInfo.title);
    titleTokens.forEach(setTitleToken(titleElement, inputElement));

    const thumbnailElement = containerElement.querySelector("img.thumbnail");
    thumbnailElement.setAttribute("src", videoInfo.thumbnail);

    // cursor focus on the input field
    inputElement.focus();
}

function setSuggestedQuestions(response) {
    const containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );
    const thumbnailElement = containerElement.querySelector(
        ".video-info img.thumbnail"
    );
    const captionElement = containerElement.querySelector(
        ".video-info .caption"
    );

    thumbnailElement.setAttribute("title", response.caption);
    captionElement.textContent = response.caption;

    captionElement.addEventListener("click", textToInputClickListener);

    setQuestions(response.questions, containerElement);
}

function setQuestions(questions, containerElement = null) {
    if (!questions || questions.length === 0) {
        return;
    }

    containerElement =
        containerElement ||
        document.querySelector(`ytd-popup-container #${containerId}`);
    const suggestionsElement = containerElement.querySelector("ul.suggestions");

    questions.forEach((question) => {
        const li = document.createElement("li");
        li.textContent = question;
        suggestionsElement.appendChild(li);

        li.addEventListener("click", textToInputClickListener);
    });
}

function textToInputClickListener(e) {
    const text = e.target.textContent;
    if (text) {
        const containerElement = e.target.closest(`#${containerId}`);
        const inputElement =
            containerElement.querySelector("input[type='text']");
        inputElement.value = text;

        // focus on the input field, and move the cursor to the end of the text
        inputElement.focus();
        inputElement.setSelectionRange(text.length, text.length);
    }
}

function setError(error) {
    const containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );
    const messageElement = containerElement.querySelector("p.message");

    const info = Info[error.code];
    if (info) {
        messageElement.setAttribute("type", "info");
        messageElement.innerHTML = info.message;
        return;
    }

    const knownError = Errors[error.code];
    if (knownError) {
        messageElement.innerHTML = knownError.message;
    } else {
        console.error(error);
    }

    messageElement.setAttribute("type", "error");
    messageElement.textContent = error.message;
}

function insertQuestionDialog() {
    document
        .querySelector("ytd-popup-container")
        .insertAdjacentHTML("beforeend", getQuestionHtml());

    const containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );
    // request button click event
    const requestButton = containerElement.querySelector(
        "#contents button.question-button"
    );
    requestButton.addEventListener("click", onRequestButtonClick);

    // enter key event on the input field
    const inputElement = containerElement.querySelector(
        "#contents input[type='text']"
    );
    inputElement.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            requestButton.click();
        }
    });

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

    return containerElement;
}

function onRequestButtonClick(event) {
    const buttonElement = event.target;
    const containerElement = buttonElement.closest(
        `ytd-popup-container #${containerId}`
    );
    const inputElement = containerElement.querySelector(
        "#contents input[type='text']"
    );
    const question = inputElement.value || inputElement.placeholder;
    const thumbnailElement = containerElement.querySelector("img.thumbnail");
    const videoInfo = {
        id: containerElement.getAttribute("video-id"),
        title: containerElement.querySelector(".title").textContent,
        caption: thumbnailElement.getAttribute("title") || null,
    };
    const target = "chatgpt";

    // set loading state
    buttonElement.setAttribute("disabled", "");
    inputElement.setAttribute("disabled", "");

    try {
        chrome.runtime.sendMessage(
            { message: "setPrompt", target: target, videoInfo, question },
            (response) => {
                onPromptSet(response);
                buttonElement.removeAttribute("disabled");
                inputElement.removeAttribute("disabled");
            }
        );
    } catch (error) {
        console.error("sendMessage setPrompt Error:", error);
        showToastMessage(`sendMessage setPrompt Error: ${error.message}`);
        buttonElement.removeAttribute("disabled");
        inputElement.removeAttribute("disabled");
    }
}

function onPromptSet(response) {
    if (isQuestionDialogClosed()) {
        return;
    }

    if (chrome.runtime.lastError) {
        const errorMessage = `Error - ${
            chrome.runtime.lastError.message || chrome.runtime.lastError
        }`;
        console.error("Error setting prompt.", chrome.runtime.lastError);
        showToastMessage(errorMessage);
        return;
    }

    if (response.error) {
        const { code, message } = response.error;
        if (code === "TRANSCRIPT_NOT_FOUND") {
            showToastMessage(message);
        } else {
            const errorMessage = `Error - code: ${code}`;
            console.error("Error setting prompt.", response.error);
            showToastMessage(errorMessage);
        }
        return;
    }

    if (!response.targetUrl) {
        console.error("Error - targetUrl is not set.");
        showToastMessage("Error - targetUrl is not set.");
        return;
    }

    window.open(response.targetUrl, "_blank");

    hideQuestionDialog();
}

function repositionDialog() {
    const containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );
    if (!containerElement || containerElement.style.display == "none") {
        return;
    }

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const dialogWidth = containerElement.offsetWidth;
    const dialogHeight = containerElement.offsetHeight;
    const dialogX = (screenWidth - dialogWidth) / 2;
    const dialogY = (screenHeight - dialogHeight) / 2;
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
    const containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );
    return containerElement && containerElement.style.display === "none";
}

function hideQuestionDialog() {
    const containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );
    containerElement.style.display = "none";

    const inputElement = containerElement.querySelector(
        "#contents input[type='text']"
    );
    inputElement.value = "";

    const backgroundElement = document.querySelector(
        "tp-yt-iron-overlay-backdrop"
    );
    if (backgroundElement) {
        backgroundElement.remove();
    }

    resetQuestions();
}
