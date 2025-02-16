import { Errors } from "../../errors.js";
import { getVideoInfoFromVideoDetail } from "./moreOptions.js";
import { showQuestionDialog } from "./questionView.js";

const defaultQuestion = "주요 요점이 무엇인가요?";
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

    const requestButton = containerElement.querySelector(
        ".question-input-container button"
    );
    requestButton.addEventListener("click", onRequestButtonClick);

    return containerElement;
}

function getQuestionInputFormHtml() {
    return `<div class="question-input-container">
    <input type="text" value="" placeholder="${defaultQuestion}">
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

function onPromptSet(response) {
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
