import { ObserverManager } from "../observer";
import { detectVideoOptionClick } from "./moreOptions";

// Constants
const SELECTORS = {
    SHORTS_BUTTON:
        "div.shortsLockupViewModelHostOutsideMetadataMenu div.yt-spec-touch-feedback-shape__fill",
} as const;

const observerManager = new ObserverManager();

/**
 * Manages click handlers for shorts buttons
 */
class ShortsButtonHandler {
    private static instance: ShortsButtonHandler;
    private elementHandlers = new WeakMap<HTMLElement, EventListener[]>();
    private processedElements = new WeakSet<HTMLElement>();
    private container: HTMLElement | null = null;

    private constructor() {}

    static getInstance(): ShortsButtonHandler {
        if (!ShortsButtonHandler.instance) {
            ShortsButtonHandler.instance = new ShortsButtonHandler();
        }
        return ShortsButtonHandler.instance;
    }

    setContainer(container: HTMLElement): void {
        this.container = container;
    }

    attachClickHandler(element: HTMLElement): void {
        if (this.processedElements.has(element)) return;

        const debugHandler = (e: Event) => {
            console.debug("shorts button clicked", e.target);
        };
        element.addEventListener("click", debugHandler);
        element.addEventListener("click", detectVideoOptionClick);

        this.elementHandlers.set(element, [debugHandler, detectVideoOptionClick]);
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
            console.warn("No container set for ShortsButtonHandler cleanup");
            return;
        }
        const elements = this.container.querySelectorAll<HTMLElement>(SELECTORS.SHORTS_BUTTON);
        elements.forEach(this.removeClickHandler.bind(this));
    }
}

/**
 * Sets up click handlers for shorts buttons and observes for new shorts content
 */
export const setupShortsClickHandlers = async (): Promise<void> => {
    try {
        const shortsHandler = ShortsButtonHandler.getInstance();
        shortsHandler.setContainer(document.getElementById("page-manager") || document.body);

        const applyClickHandlers = (element: HTMLElement) => {
            const buttons = element.querySelectorAll<HTMLElement>(SELECTORS.SHORTS_BUTTON);
            shortsHandler.attachClickHandlers(buttons);
            console.debug("attachClickHandlers", buttons.length);
        };

        // for shorts group section on home page
        const observeRichSectionRenderer = (node: Node): void => {
            if (
                node.nodeType !== Node.ELEMENT_NODE ||
                node.nodeName !== "YTD-RICH-SECTION-RENDERER"
            )
                return;

            applyClickHandlers(node as HTMLElement);

            observerManager.createObserver(
                node,
                (_mutations, _observer) => {
                    applyClickHandlers(node as HTMLElement);
                },
                {
                    childList: true,
                    subtree: true,
                }
            );
        };

        // for various sections on home page
        const observeHomePageContent = (element: HTMLElement): void => {
            applyClickHandlers(element);

            observerManager.createObserver(
                element,
                (mutations, _observer) => {
                    for (const mutation of mutations) {
                        if (mutation.type !== "childList" || mutation.addedNodes.length === 0)
                            continue;

                        mutation.addedNodes.forEach(observeRichSectionRenderer);
                    }
                },
                { childList: true }
            );
        };

        // for video detail page
        observerManager.observeWithSelector(
            "#page-manager > ytd-watch-flexy #related #items.yt-horizontal-list-renderer",
            applyClickHandlers
        );

        // for home page
        observerManager.observeParent(
            "#page-manager > ytd-browse #contents.ytd-rich-grid-renderer",
            observeHomePageContent
        );
    } catch (error) {
        // Keep top-level error handling to prevent the extension from breaking
        console.error("Error setting up shorts click handlers:", error);
        throw error;
    }
};

/**
 * Cleans up all observers and click handlers
 */
export const cleanup = (): void => {
    observerManager.cleanupAll();
    ShortsButtonHandler.getInstance().cleanup();
};
