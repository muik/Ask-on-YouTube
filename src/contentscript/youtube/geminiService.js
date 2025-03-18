import { BackgroundActions } from "../../constants.js";
import { loadCaptionIfPending, setCaptionUnavailable } from "./questionDialog/caption.js";

// Flag to enable/disable auto-completion functionality
let geminiServiceAvailable = null;

export function isGeminiServiceNotLoaded() {
    return geminiServiceAvailable === null;
}

export function isGeminiServiceAvailable() {
    return geminiServiceAvailable === true;
}

export function isGeminiServiceUnavailable() {
    return geminiServiceAvailable === false;
}

export async function setGeminiServiceAvailable(available) {
    if (geminiServiceAvailable === available) {
        return;
    }

    geminiServiceAvailable = available;

    onGeminiServiceAvailableChanged(available);
}

export async function loadGeminiServiceAvailable() {
    try {
        const response = await chrome.runtime.sendMessage({
            action: BackgroundActions.GET_QUESTION_COMPLETE_AVAILABLE,
        });

        if (chrome.runtime.lastError) {
            console.error(
                "Failed to load gemini service available - lastError:",
                chrome.runtime.lastError
            );
            return;
        }

        if (response.isAvailable === undefined) {
            console.error("Invalid response from background script");
            return;
        }

        setGeminiServiceAvailable(response.isAvailable);
    } catch (error) {
        if (error.message !== "Extension context invalidated.") {
            console.error("Failed to load gemini service available:", error);
        }
        setGeminiServiceAvailable(false);
    }
}

function onGeminiServiceAvailableChanged(available) {
    if (available) {
        loadCaptionIfPending();
    } else {
        setCaptionUnavailable();
    }
}
