import { BackgroundActions } from "../../constants.js";
import { loadCaptionIfPending } from "./questionDialog/caption.js";

// Flag to enable/disable auto-completion functionality
let geminiServiceAvailable = null;

export function isGeminiServiceAvailable() {
    return geminiServiceAvailable;
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
                "Failed to load gemini service available:",
                chrome.runtime.lastError
            );
            return;
        }

        if (response.isAvailable === undefined) {
            console.error("Invalid response from background script");
            return;
        }

        geminiServiceAvailable = response.isAvailable;
    } catch (error) {
        console.error("Failed to load gemini service available:", error);
    }
}

function onGeminiServiceAvailableChanged(available) {
    console.debug("Gemini service available changed:", available);

    loadCaptionIfPending();
}
