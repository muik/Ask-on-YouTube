import { BackgroundActions } from "../../constants.js";
import { Errors } from "../../errors.js";
import { getYouTubeLanguageCode } from "./questionView.ts";
import { getVideoInfoFromVideoDetail } from "./videoInfo.js";
import { pauseVideoPlayer } from "./utils.ts";

export async function loadDefaultQuestion(inputElement, setError, signal) {
    try {
        const response = await chrome.runtime.sendMessage({
            action: BackgroundActions.GET_DEFAULT_QUESTION,
            langCode: getYouTubeLanguageCode(),
        });
        if (signal.aborted) {
            return;
        }

        if (handleError(response.error)) {
            return;
        }

        if (!response.question) {
            console.error("loadDefaultQuestion Error: No question found");
            setError(Errors.FAILED_TO_LOAD_DEFAULT_QUESTION);
            return;
        }

        inputElement.setAttribute("placeholder", response.question);
    } catch (error) {
        if (signal.aborted) {
            return;
        }

        console.error("loadDefaultQuestion Error:", error);
        setError(Errors.FAILED_TO_LOAD_DEFAULT_QUESTION);
    }
}

export async function onRequestButtonClick(event, setIsRequesting, setError) {
    const buttonElement = event.target;
    const formElement = buttonElement.closest(".ytq-form");
    const inputElement = formElement.querySelector("input[type='text']");
    const question = inputElement.value || inputElement.placeholder;
    const videoInfo = getVideoInfoFromVideoDetail();
    const target = "chatgpt";

    // chrome.i18n depends on the OS language, but the YouTube language is not always the same as the OS language.
    // Assume the user wants to ask the question in the YouTube language.
    const langCode = getYouTubeLanguageCode();

    // set loading state
    setIsRequesting(true);
    setError(null);

    try {
        const response = await chrome.runtime.sendMessage({
            action: BackgroundActions.SET_PROMPT,
            target: target,
            videoInfo,
            question,
            langCode,
            type: "placeholder",
        });

        onPromptSet(response, setError);
        pauseVideoPlayer();
    } catch (error) {
        if (error.message === "Extension context invalidated.") {
            setError(Errors.EXTENSION_CONTEXT_INVALIDATED);
        } else {
            console.error("sendMessage setPrompt Error:", error);
            setError(error);
        }
    } finally {
        setIsRequesting(false);
    }
}

function handleError(error, setError) {
    if (chrome.runtime.lastError) {
        console.error("onPromptSet chrome.runtime.lastError:", chrome.runtime.lastError);
        const message = `Error - ${chrome.runtime.lastError.message || chrome.runtime.lastError}`;
        setError({ message });
        return true;
    }

    if (error) {
        const { code, message } = error;
        const knownError = Errors[code];
        if (knownError) {
            setError(knownError);
        } else {
            console.error("onPromptSet Response Error:", error);
            setError({ message });
        }
        return true;
    }

    return false;
}

function onPromptSet(response, setError) {
    if (handleError(response?.error, setError)) {
        return;
    }

    if (!response.targetUrl) {
        console.error("onPromptSet Invalid Response - targetUrl is not set. response:", response);
        setError({ message: "Invalid response, please try again later." });
        return;
    }

    window.open(response.targetUrl, "_blank");
}
