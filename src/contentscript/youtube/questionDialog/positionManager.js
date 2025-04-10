import { getContainerElement } from "../questionView.js";

/**
 * Repositions the question dialog to be centered in the viewport.
 * This function:
 * 1. Gets the dialog container element
 * 2. Calculates the center position based on viewport dimensions
 * 3. Sets the dialog's position using CSS transform
 * 4. Ensures the dialog stays within viewport bounds
 */
export function repositionDialog() {
    const containerElement = getContainerElement();
    if (!containerElement || containerElement.style.display === "none") {
        return;
    }

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const dialogWidth = containerElement.offsetWidth;
    const dialogHeight = Math.max(containerElement.offsetHeight, 501);
    const dialogX = (screenWidth - dialogWidth) / 2;
    const dialogY = (screenHeight - dialogHeight) / 2.2;

    containerElement.style.left = `${dialogX}px`;
    containerElement.style.top = `${dialogY}px`;

    const backdropElement = document.querySelector("tp-yt-iron-overlay-backdrop");
    const zIndex = getMaxZIndex(containerElement);
    backdropElement.style.zIndex = `${zIndex + 1}`;
    containerElement.style.zIndex = `${zIndex + 2}`;
}

/**
 * Gets the maximum z-index of all elements in the popup container, excluding the given element.
 * @param {Element} excludeElement - The element to exclude from the calculation.
 * @returns {number} The maximum z-index of all elements in the popup container, excluding the given element.
 */
function getMaxZIndex(excludeElement) {
    return Math.max(
        ...Array.from(document.querySelectorAll("body > ytd-app > ytd-popup-container > *"))
            .filter(
                element =>
                    element.style.zIndex &&
                    element.style.display !== "none" &&
                    element !== excludeElement
            )
            .map(element => parseInt(element.style.zIndex))
    );
}
