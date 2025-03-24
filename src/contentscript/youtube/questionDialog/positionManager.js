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

    // Set z-index to the highest possible value
    const zIndexElements = document.querySelectorAll("[style*='z-index']");
    const highestZIndex = Math.max(
        ...Array.from(zIndexElements).map(element => parseInt(element.style.zIndex)),
        2200
    );

    const backdropElement = document.querySelector("tp-yt-iron-overlay-backdrop");
    backdropElement.style.zIndex = highestZIndex + 1;
    containerElement.style.zIndex = highestZIndex + 2;
} 