import { BackgroundActions, Targets } from "../../../constants";
import { Errors } from "../../../errors";
import { getYouTubeLanguageCode, isQuestionDialogClosed } from "../questionView";
import { pauseVideoPlayer } from "../utils";
import { hideQuestionDialog } from "./dialogManager";
import { handleResponseError } from "./errorHandler";
import { VideoInfo } from "../../../types";
import { SharedQuestionFormData } from "../../../types";
import { SetPromptRequest, SetPromptResponse } from "../../../types/messages";

interface ErrorState {
    message: string;
    type?: string;
}

export function onRequestButtonClick(
    setIsRequesting: (isRequesting: boolean) => void,
    setError: (error: ErrorState | null) => void,
    videoInfo: VideoInfo,
    inputElement: HTMLTextAreaElement,
    sharedFormData: SharedQuestionFormData
): void {
    const question = inputElement.value || inputElement.placeholder;
    const target = Targets.CHATGPT;

    // chrome.i18n depends on the OS language, but the YouTube language is not always the same as the OS language.
    // Assume the user wants to ask the question in the YouTube language.
    const langCode = getYouTubeLanguageCode();

    // set loading state
    setIsRequesting(true);
    setError(null);

    try {
        const message: SetPromptRequest = {
            action: BackgroundActions.SET_PROMPT,
            target,
            videoInfo,
            question,
            langCode,
            ...sharedFormData,
        };

        chrome.runtime.sendMessage<SetPromptRequest, SetPromptResponse>(message, onPromptSet);
    } catch (error) {
        if (error instanceof Error && error.message === "Extension context invalidated.") {
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

function onPromptSet(response: SetPromptResponse): void {
    if (isQuestionDialogClosed()) {
        return;
    }

    if (handleResponseError(response)) {
        return;
    }

    if (response.targetUrl) {
        window.open(response.targetUrl, "_blank");
    }

    hideQuestionDialog();
    pauseVideoPlayer();
}
