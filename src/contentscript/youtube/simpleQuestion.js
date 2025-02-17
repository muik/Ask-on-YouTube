import { Errors } from "../../errors.js";
import { getVideoInfoFromVideoDetail } from "./moreOptions.js";
import { showQuestionDialog } from "./questionView.js";

const containerId = "ytq-simple-question";

function getContainerElement() {
    return document.querySelector(`#${containerId}`);
}

export function createQuestionInputForm() {
    const containerElement = document.createElement("div");
    containerElement.id = containerId;
    containerElement.className = "ytq-form";
    containerElement.innerHTML = getQuestionInputFormHtml();

    const inputElement = containerElement.querySelector(
        ".question-input-container input[type='text']"
    );
    inputElement.addEventListener("focus", (event) => {
        event.preventDefault();

        const videoInfo = getVideoInfoFromVideoDetail();
        showQuestionDialog(videoInfo);
    });

    loadDefaultQuestion(inputElement);

    const requestButton = containerElement.querySelector(
        ".question-input-container button"
    );
    requestButton.addEventListener("click", onRequestButtonClick);

    return containerElement;
}

async function loadDefaultQuestion(inputElement) {
    try {
        const response = await chrome.runtime.sendMessage({
            action: "getFavoriteQuestions",
        });

        if (handleError(response.error)) {
            return;
        }

        if (!response.questions || response.questions.length === 0) {
            console.error("loadDefaultQuestion Error: No questions found");
            setInputError(Errors.FAILED_TO_LOAD_DEFAULT_QUESTION);
            return;
        }

        const question = response.questions[0];
        inputElement.setAttribute("placeholder", question);
    } catch (error) {
        console.error("loadDefaultQuestion Error:", error);
        setInputError(Errors.FAILED_TO_LOAD_DEFAULT_QUESTION);
    }
}

function getQuestionInputFormHtml() {
    return `<div class="question-input-container">
    <input type="text" value="">
    <button class="question-button"><span class="default-text">요청</span><span class="loading-text">요청 중..</span></button>
</div>
<p id="question-input-error" class="message"></p>`;
}

function onRequestButtonClick(event) {
    const buttonElement = event.target;
    const formElement = buttonElement.closest(".ytq-form");
    const inputElement = formElement.querySelector("input[type='text']");
    const question = inputElement.value || inputElement.placeholder;
    const videoInfo = getVideoInfoFromVideoDetail();
    const target = "chatgpt";

    // set loading state
    buttonElement.setAttribute("disabled", "");
    inputElement.setAttribute("disabled", "");
    setInputError({}, formElement);

    try {
        chrome.runtime.sendMessage(
            {
                message: "setPrompt",
                target: target,
                videoInfo,
                question,
                type: "placeholder",
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
            setInputError(error, formElement);
        }
        resetRequesting(formElement);
    }
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

function handleError(error) {
    if (chrome.runtime.lastError) {
        console.error(
            "onPromptSet chrome.runtime.lastError:",
            chrome.runtime.lastError
        );
        const message = `Error - ${
            chrome.runtime.lastError.message || chrome.runtime.lastError
        }`;
        setInputError({ message });
        return true;
    }

    if (error) {
        const { code, message } = error;
        const knownError = Errors[code];
        if (knownError) {
            setInputError(knownError);
        } else {
            console.error("onPromptSet Response Error:", error);
            setInputError({ message });
        }
        return true;
    }

    return false;
}

function onPromptSet(response) {
    if (handleError(response.error)) {
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
}

function resetRequesting(containerElement = null) {
    containerElement = containerElement || getContainerElement();
    const inputElement = containerElement.querySelector(
        ".question-input-container input[type='text']"
    );
    const buttonElement = containerElement.querySelector(
        ".question-input-container button.question-button"
    );
    buttonElement.removeAttribute("disabled");
    inputElement.removeAttribute("disabled");
}
