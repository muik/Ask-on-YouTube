import { detectVideoOptionClick } from "../moreOptions";

// Constants
export const SELECTORS = {
    SHORTS_BUTTON:
        "div.shortsLockupViewModelHostOutsideMetadataMenu div.yt-spec-touch-feedback-shape__fill",
} as const;

/**
 * Manages click handlers for shorts buttons
 */
export class ShortsButtonHandler {
    private elementHandlers = new WeakMap<HTMLElement, EventListener[]>();
    private processedElements = new WeakSet<HTMLElement>();
    private container: HTMLElement | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    attachClickHandler(element: HTMLElement): void {
        if (this.processedElements.has(element)) return;

        element.addEventListener("click", detectVideoOptionClick);

        this.elementHandlers.set(element, [detectVideoOptionClick]);
        this.processedElements.add(element);
    }

    attachClickHandlers(elements: NodeListOf<HTMLElement> | HTMLElement[]): void {
        elements.forEach(element => this.attachClickHandler(element));
    }

    removeClickHandler(element: HTMLElement): void {
        const handlers = this.elementHandlers.get(element);
        if (handlers) {
            handlers.forEach(handler => element.removeEventListener("click", handler));
            this.elementHandlers.delete(element);
            this.processedElements.delete(element);
        }
    }

    cleanup(): void {
        // We need to query the DOM because WeakSet/WeakMap don't provide iteration methods
        // This is by design as elements could be garbage collected during iteration
        // Only cleanup buttons within our container to avoid interfering with other potential handlers
        if (!this.container) {
            return;
        }
        const elements = this.container.querySelectorAll<HTMLElement>(SELECTORS.SHORTS_BUTTON);
        elements.forEach(this.removeClickHandler.bind(this));
    }
}
