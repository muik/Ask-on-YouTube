import { Errors } from "../../../errors.ts";
import { getContainerElement } from "./container.ts";

/**
 * Sets an error message in the input error element
 * @param {Object} error - The error object containing message and type
 * @param {string} error.message - The error message to display
 * @param {string} [error.type="error"] - The type of error (e.g., "error", "warning")
 * @param {HTMLElement|null} [containerElement=null] - The container element to show the error in
 */
export function setInputError({ message = "", type = "error" }, containerElement = null) {
    if (typeof message !== "string") {
        console.error("Invalid error message type:", typeof message);
        return;
    }

    containerElement = containerElement || getContainerElement();
    if (!containerElement) {
        console.error("No container element found for error message");
        return;
    }

    const inputErrorElement = containerElement.querySelector("#question-input-error");
    if (!inputErrorElement) {
        console.error("No error element found in container");
        return;
    }

    inputErrorElement.textContent = message;
    inputErrorElement.setAttribute("type", type);
}

/**
 * Handles Chrome-specific errors
 * @param {Error} error - The Chrome error object
 * @param {HTMLElement|null} [containerElement=null] - The container element to show the error in
 */
export function handleChromeError(error, containerElement = null) {
    if (!(error instanceof Error)) {
        console.error("Invalid error object:", error);
        return;
    }

    if (error.message === "Extension context invalidated.") {
        setInputError(Errors.EXTENSION_CONTEXT_INVALIDATED, containerElement);
    } else {
        console.error("Chrome Error:", error);
        setInputError(error, containerElement);
    }
}

/**
 * Handles response errors from the background script
 * @param {Object} response - The response object from the background script
 * @returns {boolean} True if an error was handled, false otherwise
 */
export function handleResponseError(response) {
    if (!response || typeof response !== "object") {
        console.error("Invalid response object:", response);
        return true;
    }

    if (chrome.runtime.lastError) {
        console.error("Response chrome.runtime.lastError:", chrome.runtime.lastError.message);
        setInputError(Errors.UNKNOWN_ERROR);
        return true;
    }

    if (response.error) {
        const { code, message } = response.error;
        const error = Errors[code];
        if (error) {
            setInputError(error);
        } else {
            console.error("Response Error:", response.error);
            setInputError({ message });
        }
        return true;
    }

    if (!response.targetUrl) {
        console.error("Invalid Response - targetUrl is not set:", response);
        setInputError(Errors.INVALID_RESPONSE);
        return true;
    }

    return false;
} 