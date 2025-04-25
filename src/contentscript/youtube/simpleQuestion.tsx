import { BackgroundActions, Targets } from "../../constants";
import { Errors } from "../../errors";
import { getYouTubeLanguageCode } from "./questionView";
import { getVideoInfoFromVideoDetail } from "./videoInfo";
import { pauseVideoPlayer } from "./utils";
import { SetPromptRequest, SetPromptResponse } from "../../types/messages";

interface ErrorResponse {
    code?: string;
    message: string;
}

export async function loadDefaultQuestion(
    inputElement: HTMLInputElement,
    setError: (error: ErrorResponse | null) => void,
    signal: AbortSignal
): Promise<void> {
    try {
        const response = await chrome.runtime.sendMessage({
            action: BackgroundActions.GET_DEFAULT_QUESTION,
            langCode: getYouTubeLanguageCode(),
        });
        if (signal.aborted) {
            return;
        }

        if (handleError(response.error, setError)) {
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

export async function onRequestButtonClick(
    event: React.MouseEvent<HTMLButtonElement>,
    setIsRequesting: (isRequesting: boolean) => void,
    setError: (error: ErrorResponse | null) => void
): Promise<void> {
    const buttonElement = event.target as HTMLButtonElement;
    const formElement = buttonElement.closest(".ytq-form") as HTMLFormElement;
    const inputElement = formElement.querySelector("input[type='text']") as HTMLInputElement;
    const question = inputElement.value || inputElement.placeholder;
    const videoInfo = getVideoInfoFromVideoDetail();

    // chrome.i18n depends on the OS language, but the YouTube language is not always the same as the OS language.
    // Assume the user wants to ask the question in the YouTube language.
    const langCode = getYouTubeLanguageCode();

    // set loading state
    setIsRequesting(true);
    setError(null);

    try {
        const response = await chrome.runtime.sendMessage<SetPromptRequest>({
            action: BackgroundActions.SET_PROMPT,
            target: Targets.CHATGPT,
            videoInfo,
            question,
            langCode,
            type: "placeholder",
            inclusions: {
                transcript: true,
                comments: false,
            },
        });

        onPromptSet(response, setError);
        pauseVideoPlayer();
    } catch (error) {
        if (error instanceof Error && error.message === "Extension context invalidated.") {
            setError(Errors.EXTENSION_CONTEXT_INVALIDATED);
        } else {
            console.error("sendMessage setPrompt Error:", error);
            setError(error as ErrorResponse);
        }
    } finally {
        setIsRequesting(false);
    }
}

function handleError(
    error: ErrorResponse | undefined,
    setError: (error: ErrorResponse | null) => void
): boolean {
    if (chrome.runtime.lastError) {
        console.error("onPromptSet chrome.runtime.lastError:", chrome.runtime.lastError);
        const message = `Error - ${chrome.runtime.lastError.message || chrome.runtime.lastError}`;
        setError({ message });
        return true;
    }

    if (error) {
        const { code, message } = error;
        const knownError = Errors[code as keyof typeof Errors];
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

function onPromptSet(
    response: SetPromptResponse,
    setError: (error: ErrorResponse | null) => void
): void {
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
