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
    <button class="question-button">
        ${getQuestionMarkSvg()}
        <span class="default-text">요청</span><span class="loading-text">요청 중..</span>
    </button>
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

export function getQuestionMarkSvg() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <path d="M7.988-.01h.096c.458.002.904.012 1.354.104l.094.018c1.512.299 2.893.999 3.999 2.076l.063.061c.279.269.542.541.772.854l.124.162c.246.319.446.661.635 1.016l.042.078c.36.685.6 1.444.739 2.204l.015.076c.184.938.151 2.023-.046 2.955l-.021.099a8.5 8.5 0 0 1-.979 2.463c.168.203.353.385.543.567.214.21.379.422.483.706l.038.101c.137.42.111.94-.063 1.344l-.031.081c-.204.473-.644.787-1.104.981a2 2 0 0 1-1.365-.062l-.081-.031c-.243-.105-.422-.286-.607-.469l-.065-.065-.435-.434-.064.035c-1.15.633-2.423 1.089-3.749 1.096l-.087.001c-1.196.007-1.196.007-1.725-.101l-.096-.019c-1.044-.208-2.1-.603-2.967-1.231l-.058-.042A17 17 0 0 1 3 14.281l-.051-.04a7 7 0 0 1-1.317-1.346l-.121-.159a7 7 0 0 1-.636-1.017l-.042-.078a7.8 7.8 0 0 1-.739-2.203l-.015-.076a7.5 7.5 0 0 1 .015-2.799l.018-.094c.295-1.492.981-2.877 2.044-3.969l.066-.068c.304-.315.609-.614.966-.869l.051-.037A8.3 8.3 0 0 1 6.445.117l.069-.014A7.5 7.5 0 0 1 7.988-.01m-2.05 1.26-.119.035C4.073 1.83 2.613 3.123 1.75 4.719l-.036.066C1.26 5.642.97 6.659.961 7.63l-.001.08c-.005.597.003 1.173.134 1.759l.018.081q.06.259.138.513l.023.074a7 7 0 0 0 1.677 2.781l.132.138c.205.213.432.392.668.569l.054.041a7.06 7.06 0 0 0 5.171 1.329c1.05-.156 2.09-.516 2.959-1.137a.5.5 0 0 1 .294-.084l.07-.002c.217.029.348.177.492.328l.131.134.204.211.199.204.061.063c.21.213.425.324.727.33.299-.003.49-.091.708-.293.19-.213.222-.453.219-.73-.036-.475-.525-.818-.843-1.131l-.17-.168-.053-.052c-.129-.128-.201-.222-.208-.404.006-.237.136-.409.26-.603a6.6 6.6 0 0 0 .725-1.598l.022-.072q.077-.258.134-.522l.019-.084a6.9 6.9 0 0 0-.019-2.854l-.018-.081a7 7 0 0 0-.139-.513l-.023-.074c-.337-1.082-.939-2.024-1.726-2.832l-.085-.089C11.139 1.118 8.34.526 5.938 1.25"/>
  <path d="m9.125 2.906.078.019a5.3 5.3 0 0 1 1.078.387l.06.029c.945.465 1.699 1.219 2.221 2.127l.034.059c.363.645.593 1.419.598 2.161l.001.07c.007.952.007.952-.101 1.367l-.019.078c-.302 1.19-.302 1.19-.7 1.453a.64.64 0 0 1-.5-.063 2 2 0 0 1-.234-.224l-.064-.066-.201-.209-.201-.208-.124-.13c-.208-.214-.424-.324-.725-.33a.94.94 0 0 0-.683.269c-.185.211-.215.452-.212.723.028.365.3.595.548.836l.053.052.221.215.163.159.05.048a.7.7 0 0 1 .227.481c-.033.174-.084.284-.226.393-.412.244-.882.379-1.342.492l-.066.017c-.666.167-1.521.155-2.184-.017l-.078-.019a5.3 5.3 0 0 1-1.078-.387l-.06-.029c-1.21-.595-2.141-1.674-2.592-2.941a4.5 4.5 0 0 1-.261-1.406l-.001-.07-.001-.222v-.077c0-.365.014-.712.102-1.068l.027-.12a5.25 5.25 0 0 1 2.345-3.206l.191-.111.059-.034c1.039-.585 2.433-.8 3.597-.498M5.25 4.781l-.077.064a4.16 4.16 0 0 0-1.267 2.03l-.019.065a4.2 4.2 0 0 0 .019 2.185l.017.063c.162.579.472 1.105.858 1.562l.064.077c.718.833 1.766 1.313 2.853 1.415.563.04 1.107-.057 1.646-.21A4 4 0 0 0 9 11.661c-.406-.405-.54-.865-.541-1.425.003-.246.037-.445.135-.672l.031-.081c.164-.379.513-.705.886-.872.49-.195 1.06-.228 1.552-.016l.081.031c.243.105.421.286.607.469l.079.078.17.171c.067-.116.096-.24.127-.369l.016-.065a4.14 4.14 0 0 0-.05-2.035l-.017-.063c-.161-.579-.471-1.105-.857-1.562l-.064-.077c-.718-.833-1.766-1.313-2.853-1.415A4.23 4.23 0 0 0 5.25 4.781"/>
</svg>`;
}
