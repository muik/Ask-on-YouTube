import { BackgroundActions, QuestionOptionKeys } from "../../constants.js";
import { getVideoThumbnailUrl } from "../../data.js";
import { Errors, Info } from "../../errors.js";
import { initAutoComplete } from "./autoComplete.js";
import { getQuestionHtml } from "./questionDialog/html.js";
import { getTitleTokens, setTitleToken } from "./questionDialog/titleToken.js";

export const containerId = "dialog-container";
const dialogData = {};

function getContainerElement() {
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

    const questionOption = getSelectedQuestionOption();
    if (!questionOption) {
        loadLastQuestionOption(containerElement);
    } else {
        loadQuestions(questionOption, containerElement);
    }

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

async function loadLastQuestionOption(containerElement) {
    try {
        showProgressSpinner(containerElement);
        setQuestionsError(null, containerElement);

        const response = await chrome.runtime.sendMessage({
            action: BackgroundActions.GET_LAST_QUESTION_OPTION,
        });

        if (chrome.runtime.lastError) {
            console.error(
                "requestLastQuestionOption lastError:",
                chrome.runtime.lastError
            );
            throw Errors.UNKNOWN_ERROR;
        }

        if (response.error) {
            if (!response.error.code) {
                console.error("requestLastQuestionOption Error:", response);
            }
            throw response.error;
        }

        if (!response.option) {
            console.error(
                "requestLastQuestionOption Error: no option",
                response
            );
            throw Errors.INVALID_RESPONSE;
        }

        clickQuestionOption(response.option);

        // Load the caption when the option is not "suggestions"
        // because the suggestions response contains the caption
        if (response.option !== QuestionOptionKeys.SUGGESTIONS) {
            loadCaption(containerElement);
        }
    } catch (error) {
        setQuestionsError(error);
        hideProgressSpinner();
    }
}

async function loadCaption(containerElement) {
    const thumbnailElement = containerElement.querySelector("img.thumbnail");
    const imageUrl = thumbnailElement.getAttribute("src");
    const imageData = getImageData(thumbnailElement);

    try {
        const response = await chrome.runtime.sendMessage({
            action: BackgroundActions.GET_CAPTION,
            imageUrl,
            imageData,
        });

        if (chrome.runtime.lastError) {
            throw chrome.runtime.lastError;
        }
        if (response.error) {
            throw response.error;
        }

        if (response.caption) {
            setCaption(response.caption);
        }
    } catch (error) {
        console.error("loadCaption Error:", error);
    }
}

function getImageData(imgElement) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    ctx.drawImage(imgElement, 0, 0);

    // Convert canvas to Base64
    const base64Data = canvas.toDataURL("image/jpeg", 0.9); // Convert to JPEG
    canvas.remove();
    return base64Data;
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

/**
 * Get the selected question option from the container element
 * @returns {string | null} The selected question option, null when first loaded
 */
function getSelectedQuestionOption() {
    const containerElement = getContainerElement();
    return (
        containerElement
            .querySelector(".question-options .title.active")
            ?.getAttribute("data-option") || null
    );
}

function loadQuestions(option, containerElement = null) {
    showProgressSpinner(containerElement);
    setQuestionsError(null, containerElement);
    requestQuestions(option);
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

async function requestQuestions(option) {
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
        }
    }
}

function handleQuestionsResponse(response) {
    if (handleQuestionsResponseError(response)) {
        return;
    }

    if (!response.questions || response.questions.length === 0) {
        const questionOption = getSelectedQuestionOption();
        if (questionOption === QuestionOptionKeys.RECENTS) {
            setQuestionsError(Info.NO_RECENT_QUESTIONS);
        } else {
            console.error("questions response:", response);
            setQuestionsError(Errors.INVALID_RESPONSE);
        }
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

function clickQuestionOption(option) {
    getContainerElement()
        .querySelector(`.question-options .title[data-option="${option}"]`)
        .click();
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

function setCaption(caption) {
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
        li.innerHTML = `<span class="question">${question}</span><button class="request">&gt;</button>`;
        li.querySelector("span.question").addEventListener(
            "click",
            textToInputClickListener
        );
        li.querySelector("button.request").addEventListener(
            "click",
            textRequestButtonClickListener
        );

        suggestionsElement.appendChild(li);
    });
}

function textRequestButtonClickListener(e) {
    e.preventDefault();
    e.target.previousElementSibling.click();
    e.target
        .closest("#contents")
        .querySelector(".question-input-container .question-button")
        .click();
}

function textToInputClickListener(e) {
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
        "#contents textarea.question-input"
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

    initAutoComplete(inputElement);

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
        ?.classList.remove("active");
    optionElement.classList.add("active");

    resetQuestions();

    const option = optionElement.getAttribute("data-option");
    loadQuestions(option);
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
    setQuestionsError(null, containerElement);

    resetRequesting(containerElement);
    setInputError({}, containerElement);
}
