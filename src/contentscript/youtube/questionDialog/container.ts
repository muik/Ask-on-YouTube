export const containerId = "dialog-container";

/**
 * Gets the container element for the question dialog
 * @returns {HTMLElement | null} The container element if found, null otherwise
 */
export function getContainerElement(): HTMLElement | null {
    return document.querySelector(`ytd-popup-container #${containerId}`);
} 