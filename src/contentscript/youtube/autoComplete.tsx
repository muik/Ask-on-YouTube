import { BackgroundActions } from "../../constants";
import { Errors } from "../../errors";
import { VideoInfo } from "../../types";

/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce delay in milliseconds
 * @returns {Function} - The debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return function (this: any, ...args: Parameters<T>) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Track the last input value that triggered a request
let lastRequestedInput: string | null = null;
// Track active request IDs
let currentRequestId = 0;
let activeRequestId: number | null = null;

// Minimum characters required to trigger auto-completion
const MIN_CHARS = 2;

function normalizeText(text: string): string {
    return text.toLowerCase();
}

function isQuestionStart(completedText: string, questionStart: string): boolean {
    return normalizeText(completedText).startsWith(normalizeText(questionStart));
}

/**
 * Adjust the height of an input element to match its content
 * @param {HTMLElement} inputElement - The input element to adjust
 */
export function adjustInputHeight(inputElement: HTMLTextAreaElement): void {
    inputElement.style.height = "auto";
    inputElement.style.height = inputElement.scrollHeight + "px";
}

/**
 * Handle keydown events for auto-completion
 */
export function handleKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    inputElement: HTMLTextAreaElement,
    setAutoCompleteData: (data: { currentText: string; completedText: string } | null) => void,
    autoCompleteData: { currentText: string; completedText: string } | null
): void {
    switch (e.key) {
        case "Tab":
            if (autoCompleteData) {
                e.preventDefault();

                // Prevent the last character of the inputted Korean text
                // from being added to the end of the sentence
                setTimeout(() => {
                    handleTabKey(inputElement, setAutoCompleteData, autoCompleteData);
                }, 1);
            }
            break;
        case "Enter":
            if (!e.shiftKey) {
                e.preventDefault();
                cleanupSuggestion(inputElement, setAutoCompleteData);

                const button = inputElement
                    .closest(".question-input-container")
                    ?.querySelector<HTMLButtonElement>(".question-button");
                if (button) {
                    button.click();
                }
            }
            break;
    }
}

/**
 * Cancel any pending question completion request
 */
export function cancelPendingRequest(): void {
    // Increment the request ID to invalidate any pending requests
    currentRequestId++;
    activeRequestId = null;
}

/**
 * Handle input changes to trigger auto-completion
 * @param {Event} e - The input event
 */
export async function handleInputChange(
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    setAutoCompleteData: (data: { currentText: string; completedText: string } | null) => void,
    videoInfo: VideoInfo,
    setError: (error: { message: string; type?: string } | null) => void
): Promise<void> {
    const inputElement = e.target as HTMLTextAreaElement;
    const questionStart = inputElement.value;
    lastRequestedInput = questionStart;

    // Clear suggestion if input is too short or recently accepted a suggestion
    if (questionStart.replace(/\s+/g, "").length < MIN_CHARS) {
        cleanupSuggestion(inputElement, setAutoCompleteData);
        return;
    }

    // Create a new request ID for this request
    const requestId = ++currentRequestId;
    activeRequestId = requestId;

    // Request question completion from background script
    const startTime = performance.now();
    let response;
    try {
        response = await chrome.runtime.sendMessage({
            action: BackgroundActions.GET_QUESTION_COMPLETE,
            questionStart,
            videoInfo,
        });
    } catch (error) {
        if (error instanceof Error && error.message === "Extension context invalidated.") {
            setError(Errors.EXTENSION_CONTEXT_INVALIDATED);
            return;
        }
        console.error("Error getting question completion:", error);
        return;
    }

    // If this request is no longer the active request, ignore the response
    if (requestId !== activeRequestId) {
        return;
    }

    const endTime = performance.now();
    console.debug("Question completion response time:", (endTime - startTime).toFixed(1), "ms");

    // Check if the input has changed since the request was sent
    if (lastRequestedInput !== questionStart) {
        return;
    }

    if (chrome.runtime.lastError) {
        console.error("Error getting question completion:", chrome.runtime.lastError);
        return;
    }

    if (response && response.error) {
        console.error("Error getting question completion:", response.error);
        return;
    }

    if (!response || !response.questionComplete) {
        console.error("No question completion response");
        return;
    }

    // Ensure the completed text is different from what the user typed
    const completedText = response.questionComplete;

    if (completedText === questionStart) {
        return;
    }

    // Check if the completed text actually extends the current text
    if (!isQuestionStart(completedText, questionStart)) {
        console.debug("Completed text doesn't start with current text, fixing");
        cleanupSuggestion(inputElement, setAutoCompleteData);
        return;
    }

    setAutoCompleteData({
        currentText: questionStart,
        completedText: completedText,
    });
}

/**
 * Handle tab key press to accept suggestions
 * @param {HTMLTextAreaElement} inputElement - The input element
 */
function handleTabKey(
    inputElement: HTMLTextAreaElement,
    setAutoCompleteData: (data: { currentText: string; completedText: string } | null) => void,
    autoCompleteData: { currentText: string; completedText: string } | null
): void {
    // Get the suggestion text
    const suggestion = autoCompleteData?.completedText;
    if (!suggestion) {
        return;
    }

    // Update the input value
    inputElement.value = suggestion;

    // Move cursor to the end
    inputElement.selectionStart = suggestion.length;
    inputElement.selectionEnd = suggestion.length;

    // Clean up the suggestion
    cleanupSuggestion(inputElement, setAutoCompleteData);
}

/**
 * Clean up the suggestion element and cancel any pending requests
 */
export function cleanupSuggestion(
    inputElement: HTMLTextAreaElement,
    setAutoCompleteData: (data: { currentText: string; completedText: string } | null) => void
): void {
    setAutoCompleteData(null);

    // Cancel any pending request when cleaning up
    cancelPendingRequest();

    adjustInputHeight(inputElement);
}
