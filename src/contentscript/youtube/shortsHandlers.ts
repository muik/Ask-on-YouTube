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
        observerManager.observeParent(
            "#page-manager > ytd-watch-flexy #related #contents.ytd-item-section-renderer", // section list in related
            element => observeReelShelfRenderers(element, applyClickHandlers),
            () => window.location.pathname === "/watch" && window.location.search.includes("v=")
        );
        observerManager.observeParent(
            "#page-manager > ytd-watch-flexy #related > ytd-watch-next-secondary-results-renderer > #items",
            element => observeReelShelfRenderers(element, applyClickHandlers),
            () => window.location.pathname === "/watch" && window.location.search.includes("v=")
        );

        // for /feed/history page
        observerManager.observeParent(
            "#page-manager > ytd-browse[page-subtype='history'] > ytd-two-column-browse-results-renderer > #primary > ytd-section-list-renderer > #contents",
            element => observeShortsInItemSections(element, applyClickHandlers),
            () => window.location.pathname === "/feed/history"
        );

        // for channel page
        observerManager.observeParent(
            "#page-manager > ytd-browse[page-subtype='channels'] > ytd-two-column-browse-results-renderer > #primary > ytd-section-list-renderer > #contents",
            element => observeShortsInItemSections(element, applyClickHandlers),
            () => window.location.pathname.startsWith("/@")
        );

        // for home page
        observerManager.observeParent(
            "#page-manager > ytd-browse #contents.ytd-rich-grid-renderer",
            observeHomePageContent,
            () => window.location.pathname === "/"
        );
    } catch (error) {
        // Keep top-level error handling to prevent the extension from breaking
        console.error("Error setting up shorts click handlers:", error);
        throw error;
    }
};

/**
 * Sets up observers and click handlers for reel shelf renderers in the related section
 * @param element - The element to observe
 * @param applyClickHandlers - The function to apply click handlers to the reel shelf renderers
 */
function observeReelShelfRenderers(
    element: HTMLElement,
    applyClickHandlers: (element: HTMLElement) => void
): void {
    function observeSection(section: HTMLElement) {
        applyClickHandlers(section);

        observerManager.createObserver(
            section,
            (_mutations, _observer) => {
                applyClickHandlers(section);
            },
            { childList: true, subtree: true }
        );
    }

    // existing reel shelf renderers
    element
        .querySelectorAll<HTMLElement>(":scope > ytd-reel-shelf-renderer")
        .forEach(observeSection);

    // new reel shelf renderers
    observerManager.createObserver(
        element,
        (mutations, _observer) => {
            for (const mutation of mutations) {
                if (mutation.type !== "childList" || mutation.addedNodes.length === 0) {
                    continue;
                }

                for (const node of mutation.addedNodes) {
                    if (
                        node.nodeType !== Node.ELEMENT_NODE ||
                        node.nodeName !== "YTD-REEL-SHELF-RENDERER"
                    )
                        continue;

                    observeSection(node as HTMLElement);
                }
            }
        },
        { childList: true }
    );
}

/**
 * Observes and processes content sections for history and channel pages
 * @param element - The element to observe
 * @param applyClickHandlers - The function to apply click handlers
 */
function observeShortsInItemSections(
    element: HTMLElement,
    applyClickHandlers: (element: HTMLElement) => void
): void {
    const contents = element.querySelectorAll<HTMLElement>("#contents.ytd-item-section-renderer");
    contents.forEach(content => observeReelShelfRenderers(content, applyClickHandlers));

    observerManager.createObserver(
        element,
        (mutations, _observer) => {
            for (const mutation of mutations) {
                if (mutation.type !== "childList" || mutation.addedNodes.length === 0) continue;

                for (const node of mutation.addedNodes) {
                    if (
                        node.nodeType !== Node.ELEMENT_NODE ||
                        node.nodeName !== "YTD-ITEM-SECTION-RENDERER"
                    )
                        continue;

                    const contents = (node as HTMLElement).querySelectorAll<HTMLElement>(
                        "#contents.ytd-item-section-renderer"
                    );
                    contents.forEach(content =>
                        observeReelShelfRenderers(content, applyClickHandlers)
                    );
                }
            }
        },
        { childList: true }
    );
}

/**
 * Cleans up all observers and click handlers
 */
export const cleanup = (): void => {
    observerManager.cleanupAll();
    ShortsButtonHandler.getInstance().cleanup();
};
