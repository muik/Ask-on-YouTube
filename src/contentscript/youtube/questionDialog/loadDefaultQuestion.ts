import { BackgroundActions } from "../../../constants";
import { Errors } from "../../../errors";
import { getYouTubeLanguageCode } from "../questionView";

export async function loadDefaultQuestion(
    setPlaceholder: (placeholder: string) => void,
    setError: (error: { message: string; type?: string } | null) => void,
    signal: AbortSignal
) {
    try {
        const response = await chrome.runtime.sendMessage({
            action: BackgroundActions.GET_DEFAULT_QUESTION,
            langCode: getYouTubeLanguageCode(),
        });
        if (signal.aborted) {
            return;
        }

        if (chrome.runtime.lastError) {
            throw chrome.runtime.lastError;
        }
        if (response.error) {
            throw response.error;
        }
        if (!response.question) {
            throw new Error(`No question found: ${JSON.stringify(response)}`);
        }

        setPlaceholder(response.question);
    } catch (error: any) {
        if (signal.aborted) {
            return;
        }
        if (error.message === "Extension context invalidated.") {
            setError({
                message: Errors.EXTENSION_CONTEXT_INVALIDATED.message,
            });
        } else {
            console.error("loadDefaultQuestion Error:", error);
            setError({
                message: Errors.FAILED_TO_LOAD_DEFAULT_QUESTION.message,
            });
        }
    }
}
