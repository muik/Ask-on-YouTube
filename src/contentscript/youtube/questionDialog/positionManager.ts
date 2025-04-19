/**
 * Repositions the question dialog to be centered in the viewport.
 * This function:
 * 1. Gets the dialog container element
 * 2. Calculates the center position based on viewport dimensions
 * 3. Sets the dialog's position using CSS transform
 * 4. Ensures the dialog stays within viewport bounds
 */
export function repositionDialog(containerElement: HTMLElement | null): void {
    if (!containerElement || containerElement.style.display === "none") {
        return;
    }

    const screenWidth: number = window.innerWidth;
    const screenHeight: number = window.innerHeight;
    const dialogWidth: number = containerElement.offsetWidth;
    const dialogHeight: number = Math.max(containerElement.offsetHeight, 501);
    const dialogX: number = (screenWidth - dialogWidth) / 2;
    const dialogY: number = (screenHeight - dialogHeight) / 2.2;

    containerElement.style.left = `${dialogX}px`;
    containerElement.style.top = `${dialogY}px`;

    const backdropElement: HTMLElement | null = document.querySelector(
        "tp-yt-iron-overlay-backdrop"
    );
    if (backdropElement) {
        const zIndex: number = getBaseZIndex(containerElement);
        backdropElement.style.zIndex = `${zIndex + 1}`;
        containerElement.style.zIndex = `${zIndex + 2}`;
    }
}

/**
 * Gets the base z-index from the highest z-index of all elements in the popup container, excluding the given element.
 * @param {HTMLElement} excludeElement - The element to exclude from the calculation.
 * @returns {number} The base z-index
 */
function getBaseZIndex(excludeElement: HTMLElement): number {
    const minZIndex: number = 2200;
    return Math.max(
        minZIndex,
        ...Array.from(document.querySelectorAll("body > ytd-app > ytd-popup-container > *"))
            .filter(
                (element: Element): element is HTMLElement =>
                    element instanceof HTMLElement &&
                    Boolean(element.style.zIndex) &&
                    element.style.display !== "none" &&
                    element !== excludeElement
            )
            .map((element: HTMLElement) => parseInt(element.style.zIndex))
    );
}
