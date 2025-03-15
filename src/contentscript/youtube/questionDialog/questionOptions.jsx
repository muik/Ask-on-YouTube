import React from 'react';
import { createRoot } from 'react-dom/client';
import { BackgroundActions, QuestionOptionKeys } from "../../../constants.js";
import { Errors, Info } from "../../../errors.js";
import {
    getContainerElement,
    getDialogData,
    getYouTubeLanguageCode,
    textToInputClickListener,
} from "../questionView.js";
import {
    addCaptionLoadChangedListener,
    isCaptionResolved,
    removeCaptionLoadChangedListener,
    setCaption,
} from "./caption.js";
import QuestionItem from './questionItem';

/**
 * Load the question options on initial load
 * @param {Element} containerElement - The container element
 */
export function loadQuestionOptions(containerElement) {
    const questionOption = getSelectedQuestionOption();
    if (!questionOption) {
        loadLastQuestionOption(containerElement);
    } else {
        loadQuestions(questionOption, containerElement);
    }
}

/**
 * Set the question options view
 * @param {Element} containerElement - The container element
 */
export function setQuestionOptionsView(containerElement) {
    // question options click event
    containerElement
        .querySelectorAll(".question-options .title")
        .forEach((el) => {
            el.addEventListener("click", onQuestionOptionClick);
        });
}

/**
 * Reset the questions
 * @param {Element} containerElement - The container element
 */
export function resetQuestions(containerElement = null) {
    containerElement = containerElement || getContainerElement();
    containerElement.querySelector("ul.suggestions").innerHTML = "";

    // remove message
    const messageElement = containerElement.querySelector(
        "#question-suggestions-error"
    );
    messageElement.innerHTML = "";
    messageElement.removeAttribute("type");

    setQuestionsError(null, containerElement);
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
    } catch (error) {
        setQuestionsError(error);
        hideProgressSpinner();
    }
}

function loadQuestions(option, containerElement = null) {
    showProgressSpinner(containerElement);
    setQuestionsError(null, containerElement);
    requestQuestions(option);
}

let requestQuestionsPendingListener = null;

export function clearRequestQuestionsPendingListener() {
    if (requestQuestionsPendingListener) {
        removeCaptionLoadChangedListener(requestQuestionsPendingListener);
        requestQuestionsPendingListener = null;
    }
}

async function requestQuestions(option) {
    clearRequestQuestionsPendingListener();

    try {
        validateQuestionOption(option);

        const videoInfo = getDialogData().videoInfo;

        if (option === QuestionOptionKeys.SUGGESTIONS) {
            if (!isCaptionResolved()) {
                requestQuestionsPendingListener = (event) => {
                    if (event.isResolved) {
                        requestQuestions(option);
                    }
                };
                addCaptionLoadChangedListener(requestQuestionsPendingListener);
                return;
            }
        }

        const response = await chrome.runtime.sendMessage({
            action: BackgroundActions.GET_QUESTIONS,
            option,
            videoInfo,
            langCode: getYouTubeLanguageCode(),
        });

        if (!isQuestionOptionActive(option)) {
            // stop, when the option is changed
            return;
        }

        handleQuestionsResponse(response);
    } catch (error) {
        setRequestQuestionsError(error);
    } finally {
        if (
            isQuestionOptionActive(option) &&
            !requestQuestionsPendingListener
        ) {
            hideProgressSpinner();
        }
    }
}

function validateQuestionOption(option) {
    if (Object.values(QuestionOptionKeys).includes(option) === false) {
        console.error("Invalid question option:", option);
        throw Errors.INVALID_REQUEST;
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

    messageElement.setAttribute("type", "error");

    const knownError = Errors[error.code];
    if (knownError) {
        if (knownError.code === "GEMINI_API_KEY_NOT_SET") {
            messageElement.setAttribute("type", "info");
        }
        messageElement.innerHTML = knownError.message;
    } else {
        console.error(error);
        messageElement.textContent = error.message;
    }
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

function setQuestions(questions, containerElement = null) {
    if (!questions || questions.length === 0) {
        return;
    }

    containerElement = containerElement || getContainerElement();
    const suggestionsElement = containerElement.querySelector("ul.suggestions");
    suggestionsElement.innerHTML = "";

    const root = createRoot(suggestionsElement);
    root.render(
        questions.map((question, index) => (
            <QuestionItem
                key={index}
                question={question}
                onQuestionClick={textToInputClickListener}
                onRequestClick={textRequestButtonClickListener}
            />
        ))
    );
}

function textRequestButtonClickListener(e) {
    e.preventDefault();
    e.target.previousElementSibling.click();
    e.target
        .closest("#contents")
        .querySelector(".question-input-container .question-button")
        .click();
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

function clickQuestionOption(option) {
    getContainerElement()
        .querySelector(`.question-options .title[data-option="${option}"]`)
        .click();
}

function isQuestionOptionActive(option) {
    const selectedQuestionOption = getSelectedQuestionOption();
    return selectedQuestionOption === option;
}

function setRequestQuestionsError(error) {
    if (error.message === "Extension context invalidated.") {
        setQuestionsError(Errors.EXTENSION_CONTEXT_INVALIDATED);
    } else {
        setQuestionsError(error);
    }
}

function handleQuestionsResponseError(response) {
    if (chrome.runtime.lastError || response.error) {
        const error = chrome.runtime.lastError || response.error;
        setQuestionsError(error);
        return true;
    }
    return false;
}
