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
    return `<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
 width="16" height="16" viewBox="0 0 512.000000 512.000000"
 preserveAspectRatio="xMidYMid meet">
<g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
fill="#000000" stroke="none">
<path d="M2732 4959 c-83 -14 -160 -56 -228 -123 -89 -90 -134 -202 -134 -337
l0 -48 -57 27 c-53 24 -69 27 -173 27 -111 0 -118 -1 -185 -34 -90 -44 -162
-116 -206 -206 l-34 -70 -3 -858 c-1 -509 -6 -857 -12 -855 -5 2 -84 71 -176
153 -263 236 -310 265 -454 286 -193 28 -405 -82 -490 -254 -57 -115 -50 -259
17 -362 15 -22 255 -332 533 -690 279 -357 549 -711 600 -785 120 -175 175
-243 257 -320 182 -171 388 -276 645 -332 91 -19 134 -22 373 -22 306 0 393
10 575 70 228 76 398 181 571 353 212 212 336 442 402 741 20 93 21 123 24
1214 3 789 0 1135 -7 1172 -27 129 -117 247 -233 304 -122 60 -250 62 -373 6
l-54 -25 0 123 c0 95 -5 139 -20 188 -64 207 -270 336 -481 300 -38 -7 -88
-21 -109 -32 -22 -11 -43 -20 -48 -20 -5 0 -12 23 -15 51 -9 70 -54 163 -111
226 -57 63 -162 119 -251 133 -67 11 -70 11 -143 -1z m149 -210 c55 -17 108
-65 135 -123 l24 -51 0 -872 c0 -529 4 -882 10 -897 23 -62 113 -78 162 -29
l30 30 6 725 7 724 28 42 c41 63 97 95 172 100 35 2 80 -1 100 -8 48 -16 101
-63 128 -114 l22 -41 5 -870 c3 -478 9 -877 13 -886 10 -21 60 -49 87 -49 27
0 77 28 87 49 4 9 10 284 13 611 l5 595 28 47 c91 155 304 159 395 8 l32 -54
0 -1107 c0 -954 -2 -1119 -15 -1195 -78 -442 -400 -816 -826 -958 -172 -58
-271 -69 -568 -63 -222 4 -267 7 -336 26 -111 30 -177 56 -265 102 -169 91
-297 213 -432 413 -100 149 -123 178 -697 915 -254 326 -467 605 -472 618 -5
13 -9 46 -9 73 0 66 46 132 120 174 50 28 63 31 140 31 68 0 93 -5 125 -22 22
-12 164 -132 315 -268 151 -136 289 -255 305 -266 43 -27 79 -24 117 10 l33
29 5 974 5 975 30 49 c93 149 294 150 393 1 l27 -41 5 -724 5 -724 33 -29 c44
-39 90 -39 134 0 l33 29 5 949 c6 1051 0 971 72 1040 61 59 143 77 229 52z"/>
</g>
</svg>`;
}
