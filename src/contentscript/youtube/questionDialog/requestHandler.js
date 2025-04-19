import { BackgroundActions } from "../../../constants.ts";
import { Errors } from "../../../errors.ts";
import {
    getYouTubeLanguageCode,
    isQuestionDialogClosed,
    pauseVideoPlayer,
} from "../questionView.ts";
import { hideQuestionDialog } from "./dialogManager.ts";
import { handleResponseError } from "./errorHandler.js";

export function onRequestButtonClick(event, setIsRequesting, setError, videoInfo, inputElement) {
    const question = inputElement.value || inputElement.placeholder;
    const target = "chatgpt";

    // chrome.i18n depends on the OS language, but the YouTube language is not always the same as the OS language.
    // Assume the user wants to ask the question in the YouTube language.
    const langCode = getYouTubeLanguageCode();

    // set loading state
    setIsRequesting(true);
    setError(null);

    try {
        chrome.runtime.sendMessage(
            {
                action: BackgroundActions.SET_PROMPT,
                target: target,
                videoInfo,
                question,
                langCode,
            },
            onPromptSet
        );
    } catch (error) {
        if (error.message === "Extension context invalidated.") {
            setError({
                message: Errors.EXTENSION_CONTEXT_INVALIDATED.message,
                type: "error",
            });
        } else {
            console.error("Chrome Error:", error);
            setError({
                message: Errors.FAILED_TO_LOAD_DEFAULT_QUESTION.message,
                type: "error",
            });
        }

        setIsRequesting(false);
    }
}

function onPromptSet(response) {
    if (isQuestionDialogClosed()) {
        return;
    }

    if (handleResponseError(response)) {
        return;
    }

    window.open(response.targetUrl, "_blank");

    hideQuestionDialog();
    pauseVideoPlayer();
}
