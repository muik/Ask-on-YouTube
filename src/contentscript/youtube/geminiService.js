import { useCallback, useEffect, useState } from "preact/hooks";
import { BackgroundActions } from "../../constants.ts";
import { loadCaptionIfPending, setCaptionUnavailable } from "./questionDialog/caption.js";

/**
 * @typedef {Object} GeminiServiceState
 * @property {boolean | null} isAvailable - Whether the Gemini service is available
 * @property {boolean} isNotLoaded - Whether the service state is not yet loaded
 * @property {boolean} isServiceAvailable - Whether the service is available
 * @property {boolean} isServiceUnavailable - Whether the service is unavailable
 * @property {() => Promise<void>} loadGeminiServiceAvailable - Function to load service availability
 */

/**
 * Custom hook for managing Gemini service state
 * @returns {GeminiServiceState}
 */
export function useGeminiService() {
    const [isAvailable, setIsAvailable] = useState(null);

    const onGeminiServiceAvailableChanged = useCallback((available) => {
        if (available) {
            loadCaptionIfPending();
        } else {
            setCaptionUnavailable();
        }
    }, []);

    const loadGeminiServiceAvailable = useCallback(async () => {
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

            setIsAvailable(response.isAvailable);
            onGeminiServiceAvailableChanged(response.isAvailable);
        } catch (error) {
            if (error.message !== "Extension context invalidated.") {
                console.error("Failed to load gemini service available:", error);
            }
            setIsAvailable(false);
            onGeminiServiceAvailableChanged(false);
        }
    }, [onGeminiServiceAvailableChanged]);

    useEffect(() => {
        loadGeminiServiceAvailable();
    }, [loadGeminiServiceAvailable]);

    return {
        isAvailable,
        isNotLoaded: isAvailable === null,
        isServiceAvailable: isAvailable === true,
        isServiceUnavailable: isAvailable === false,
        loadGeminiServiceAvailable
    };
}

// For backward compatibility with non-React components
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
