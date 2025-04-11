import { BackgroundActions, Targets } from "../../constants";
import { PromptData } from "../../types";

/**
 * Sends a message to the background script with the answer URL.
 * Handles any errors that occur during message sending.
 *
 * @param {PromptData} promptData - The prompt data containing video and question information
 * @param {string} answerUrl - The URL of the ChatGPT answer
 */
async function sendAnswerMessage(promptData: PromptData, answerUrl: string): Promise<void> {
    try {
        await chrome.runtime.sendMessage({
            action: BackgroundActions.SET_ANSWER,
            target: Targets.CHATGPT,
            videoId: promptData.videoInfo.id,
            question: promptData.question,
            answerUrl: answerUrl,
        });

        if (chrome.runtime.lastError) {
            console.error("Chrome runtime error:", chrome.runtime.lastError);
        }
    } catch (error) {
        console.error("Error sending message to background script:", error);
    }
}

export function isPermanentUrl(): boolean {
    return window.location.href.includes("/c/");
}

/**
 * Checks if the current URL is a permanent chat URL and handles it by sending the answer message.
 *
 * @param {PromptData} promptData - The prompt data containing video and question information
 * @returns {boolean} - True if the URL was handled, false otherwise
 */
function handlePermanentUrl(promptData: PromptData | null): boolean {
    if (promptData && isPermanentUrl()) {
        sendAnswerMessage(promptData, window.location.href);
        return true;
    }
    return false;
}

let answerUrlObserver: MutationObserver | null = null;

/**
 * Updates the answer URL when ChatGPT generates a response.
 *
 * @param {PromptData} promptData - The prompt data containing video and question information
 */
export function observeAnswerUrl(promptData: PromptData): void {
    // If current URL is already a chat URL, send the answer and exit
    if (handlePermanentUrl(promptData)) {
        return;
    }

    // Otherwise, observe for URL changes
    const observer = new MutationObserver((_, observer) => {
        if (handlePermanentUrl(promptData)) {
            observer.disconnect();
            answerUrlObserver = null;
        }
    });

    observer.observe(document, { subtree: true, childList: true });
    answerUrlObserver = observer;
}

export function stopAnswerUrlObserver(): void {
    if (answerUrlObserver) {
        answerUrlObserver.disconnect();
        answerUrlObserver = null;
    }
}

export function isAnswerUrlObserving(): boolean {
    return answerUrlObserver !== null;
}
