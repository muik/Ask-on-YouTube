import { BackgroundActions, QuestionOptionKeys } from "../../constants.js";
import { getVideoThumbnailUrl } from "../../data.js";
import { Errors, Info } from "../../errors.js";
import {
    getDialogBackgoundHtml,
    getQuestionHtml,
} from "./questionDialog/html.js";
import { getTitleTokens, setTitleToken } from "./questionDialog/titleToken.js";

export const containerId = "dialog-container";
const dialogData = {};

function getContainerElement() {
    return document.querySelector(`ytd-popup-container #${containerId}`);
}

export function showQuestionDialog(videoInfo) {
    dialogData.videoInfo = videoInfo;
    const containerElement = getContainerElement() || insertQuestionDialog();
    containerElement.style.display = "block";
    containerElement.style.zIndex = 9999;

    document.body.insertAdjacentHTML("beforeend", getDialogBackgoundHtml());

    // close the dialog when the user clicks the background
    const backgroundElement = document.querySelector(
        "tp-yt-iron-overlay-backdrop"
    );
    backgroundElement.addEventListener("click", () => {
        hideQuestionDialog();
    });

    setQuestionDialogContent(videoInfo);

    const questionOption = getSelectedQuestionOption();
    requestQuestions(questionOption, containerElement);

    loadDefaultQuestion();
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
            console.error("loadDefaultQuestion Error:", response);
            setInputError(Errors.FAILED_TO_LOAD_DEFAULT_QUESTION);
            return;
        }

        const inputElement =
            getContainerElement().querySelector("input[type='text']");
        inputElement.setAttribute("placeholder", response.question);
    } catch (error) {
        console.error("loadDefaultQuestion Error:", error);
        setInputError(Errors.FAILED_TO_LOAD_DEFAULT_QUESTION);
    }
}

/**
 * Get the selected question option from the container element
 * @returns {string} The selected question option, null when first loaded
 */
function getSelectedQuestionOption() {
    const containerElement = getContainerElement();
    return (
        containerElement
            .querySelector(".question-options .title.active")
            ?.getAttribute("data-option") || null
    );
}

function requestQuestions(option = null, containerElement = null) {
    showProgressSpinner(containerElement);
    setQuestionsError(null, containerElement);

    // set dialog position in the center of the screen
    repositionDialog();

    if (option) {
        executeRequestQuestionsByOption(option);
    } else {
        executeRequestQuestions();
    }
}

function resetQuestions(containerElement = null) {
    containerElement = containerElement || getContainerElement();
    containerElement.querySelector("ul.suggestions").innerHTML = "";

    // remove message
    const messageElement = containerElement.querySelector(
        "#question-suggestions-error"
    );
    messageElement.innerHTML = "";
    messageElement.removeAttribute("type");
}

async function executeRequestQuestionsByOption(option) {
    try {
        validateQuestionOption(option);

        const response = await chrome.runtime.sendMessage({
            action: BackgroundActions.GET_QUESTIONS,
            option,
            videoInfo: dialogData.videoInfo,
        });

        if (!isQuestionOptionActive(option)) {
            // stop, when the option is changed
            return;
        }

        handleQuestionsResponse(response);
    } catch (error) {
        setRequestQuestionsError(error);
    } finally {
        if (isQuestionOptionActive(option)) {
            hideProgressSpinner();
            repositionDialog();
        }
    }
}

async function executeRequestQuestions() {
    let lastOption = null;

    try {
        const response = await chrome.runtime.sendMessage({
            action: BackgroundActions.GET_LAST_QUESTIONS,
            videoInfo: dialogData.videoInfo,
        });

        if (getSelectedQuestionOption()) {
            // stop, when the option is changed
            return;
        }

        setQuestionOptionActive(response.option);
        lastOption = response.option;

        handleQuestionsResponse(response);
    } catch (error) {
        setRequestQuestionsError(error);
    } finally {
        if (isQuestionOptionActive(lastOption)) {
            hideProgressSpinner();
            repositionDialog();
        }
    }
}

function handleQuestionsResponse(response) {
    if (handleQuestionsResponseError(response)) {
        return;
    }
    if (!response.questions || response.questions.length === 0) {
        console.error("questions response:", response);
        setQuestionsError(Errors.INVALID_RESPONSE);
        return;
    }

    if (response.caption) {
        setCaption(response.caption);
    }
    setQuestions(response.questions);
}

function validateQuestionOption(option) {
    if (Object.values(QuestionOptionKeys).includes(option) === false) {
        console.error("Invalid question option:", option);
        throw Errors.INVALID_REQUEST;
    }
}

function setQuestionOptionActive(option) {
    getContainerElement()
        .querySelector(`.question-options .title[data-option="${option}"]`)
        .classList.add("active");
}

function isQuestionOptionActive(option) {
    const selectedQuestionOption = getSelectedQuestionOption();
    return selectedQuestionOption === option;
}

function handleQuestionsResponseError(response) {
    if (chrome.runtime.lastError || response.error) {
        const error = chrome.runtime.lastError || response.error;
        setQuestionsError(error);
        return true;
    }
    return false;
}

function setRequestQuestionsError(error) {
    if (error.message === "Extension context invalidated.") {
        setQuestionsError(Errors.EXTENSION_CONTEXT_INVALIDATED);
    } else {
        setQuestionsError(error);
    }
}

function showProgressSpinner(containerElement = null) {
    containerElement = containerElement || getContainerElement();
    const spinnerElement = containerElement.querySelector("#spinner");
    spinnerElement.removeAttribute("hidden");
    const paperSpinnerElement = spinnerElement.querySelector(
        "tp-yt-paper-spinner"
    );
    paperSpinnerElement.removeAttribute("aria-hidden");
    paperSpinnerElement.setAttribute("active", "");
}

function hideProgressSpinner() {
    const containerElement = getContainerElement();
    const spinnerElement = containerElement.querySelector("#spinner");
    spinnerElement.setAttribute("hidden", "");
}

function setQuestionDialogContent(videoInfo) {
    const containerElement = getContainerElement();
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
    thumbnailElement.setAttribute("src", getVideoThumbnailUrl(videoInfo.id));

    // cursor focus on the input field
    inputElement.focus();
}

function setCaption(caption) {
    const containerElement = getContainerElement();
    const thumbnailElement = containerElement.querySelector(
        ".video-info img.thumbnail"
    );
    const captionElement = containerElement.querySelector(
        ".video-info .caption"
    );

    thumbnailElement.setAttribute("title", caption);
    captionElement.textContent = caption;
    captionElement.addEventListener("click", textToInputClickListener);
}

function setQuestions(questions, containerElement = null) {
    if (!questions || questions.length === 0) {
        return;
    }

    containerElement = containerElement || getContainerElement();
    const suggestionsElement = containerElement.querySelector("ul.suggestions");
    suggestionsElement.innerHTML = "";

    questions.forEach((question) => {
        const li = document.createElement("li");
        li.textContent = question;
        li.addEventListener("click", textToInputClickListener);

        suggestionsElement.appendChild(li);
    });
}

function textToInputClickListener(e) {
    const text = e.target.textContent
        .replace(/\n/g, " ")
        .replace("  ", ", ")
        .trim();
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

function setQuestionsError(error, containerElement = null) {
    containerElement = containerElement || getContainerElement();
    const messageElement = containerElement.querySelector(
        "#question-suggestions-error"
    );

    if (!error) {
        messageElement.innerHTML = "";
        messageElement.removeAttribute("type");
        return;
    }

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

    const containerElement = getContainerElement();

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

    // question options click event
    containerElement
        .querySelectorAll(".question-options .title")
        .forEach((el) => {
            el.addEventListener("click", onQuestionOptionClick);
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

function onQuestionOptionClick(e) {
    const optionElement = e.target;
    if (optionElement.classList.contains("active")) {
        return;
    }

    optionElement
        .closest(".question-options")
        .querySelector(".title.active")
        .classList.remove("active");
    optionElement.classList.add("active");

    resetQuestions();

    const option = optionElement.getAttribute("data-option");
    requestQuestions(option);
}

function onRequestButtonClick(event) {
    const buttonElement = event.target;
    const formElement = buttonElement.closest(".ytq-form");
    const containerElement = formElement.closest(`#${containerId}`);
    const inputElement = formElement.querySelector("input[type='text']");
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
    setInputError({}, containerElement);

    try {
        chrome.runtime.sendMessage(
            {
                action: BackgroundActions.SET_PROMPT,
                target: target,
                videoInfo,
                question,
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
        "#contents input[type='text']"
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
            chrome.runtime.lastError
        );
        const message = `Error - ${
            chrome.runtime.lastError.message || chrome.runtime.lastError
        }`;
        setInputError({ message });
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

function repositionDialog() {
    const containerElement = getContainerElement();
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
    const containerElement = getContainerElement();
    return containerElement && containerElement.style.display === "none";
}

function hideQuestionDialog() {
    const containerElement = getContainerElement();
    containerElement.style.display = "none";

    const inputElement = containerElement.querySelector(
        "#contents input[type='text']"
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
    setQuestionsError(null, containerElement);

    resetRequesting(containerElement);
    setInputError({}, containerElement);
}
