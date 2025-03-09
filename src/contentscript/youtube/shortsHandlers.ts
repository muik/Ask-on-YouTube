import { detectVideoOptionClick } from "./moreOptions";

const SHORTS_BUTTON_SELECTOR =
    "div.shortsLockupViewModelHostOutsideMetadataMenu div.yt-spec-touch-feedback-shape__fill";

// Helper function to attach click handler to shorts elements
const attachClickHandler = (element: HTMLElement): void => {
    element.setAttribute("data-button-type", "shorts");
    element.addEventListener("click", detectVideoOptionClick);
};

// Handle existing shorts elements
const handleExistingShorts = (): boolean => {
    const elements = document.querySelectorAll<HTMLElement>(
        `${SHORTS_BUTTON_SELECTOR}:not([data-button-type="shorts"])`
    );
    if (!elements || elements.length === 0) return false;

    console.debug("shelf element found", elements);
    elements.forEach(attachClickHandler);
    return true;
};

// Setup mutation observer for dynamic content
const setupShortsObserver = (): void => {
    const observer = new MutationObserver((_mutations: MutationRecord[], observer: MutationObserver) => {
        const elements = document.querySelectorAll<HTMLElement>(
            `${SHORTS_BUTTON_SELECTOR}:not([data-button-type="shorts"])`
        );
        if (elements.length > 0) {
            elements.forEach(attachClickHandler);
            observer.disconnect();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
};

export const setupShortsClickHandlers = (): void => {
    // Try handling existing elements first
    const existingHandled = handleExistingShorts();

    // If no existing elements found, set up observer for future elements
    if (!existingHandled) {
        setupShortsObserver();
    }
}; 