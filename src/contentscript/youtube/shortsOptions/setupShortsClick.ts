import { ObserverManager } from "../../observer";
import { SELECTORS, ShortsButtonHandler } from "./shortsHandlers";

const observerManager = new ObserverManager();
let shortsHandler: ShortsButtonHandler | null = null;

/**
 * Sets up click handlers for shorts buttons and observes for new shorts content
 */
export const setupShortsClickHandlers = async (): Promise<void> => {
    try {
        shortsHandler = new ShortsButtonHandler(
            document.getElementById("page-manager") || document.body
        );

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
        observerManager.findOrObserveElement(
            // section list in related
            "#page-manager > ytd-watch-flexy #related > ytd-watch-next-secondary-results-renderer > #items.ytd-watch-next-secondary-results-renderer > ytd-item-section-renderer > #contents.ytd-item-section-renderer",
            observeReelShelfRenderers
            // no condition needed because ytd-watch-flexy is only on watch page
        );

        // for video detail page
        observerManager.findOrObserveElement(
            "#page-manager > ytd-watch-flexy #related > ytd-watch-next-secondary-results-renderer > #items.ytd-watch-next-secondary-results-renderer",
            observeReelShelfRenderers
            // no condition needed because ytd-watch-flexy is only on watch page
        );

        // for /feed/history page
        observerManager.findOrObserveElement(
            "#page-manager > ytd-browse[page-subtype='history'] > ytd-two-column-browse-results-renderer > #primary > ytd-section-list-renderer > #contents",
            observeShortsInItemSections
        );

        // for channel page
        observerManager.findOrObserveElement(
            "#page-manager > ytd-browse[page-subtype='channels'] > ytd-two-column-browse-results-renderer > #primary > ytd-section-list-renderer > #contents",
            observeShortsInItemSections
        );

        // for search page
        observerManager.findOrObserveElement(
            "#page-manager > ytd-search ytd-two-column-search-results-renderer > #primary > ytd-section-list-renderer > #contents",
            observeShortsInItemSections
        );

        // for home page
        observerManager.findOrObserveElement(
            "#page-manager > ytd-browse[page-subtype='home'] #contents.ytd-rich-grid-renderer",
            observeHomePageContent
        );

        // for channel shorts page
        observerManager.findOrObserveElement(
            "#page-manager > ytd-browse[page-subtype='channels'] #contents.ytd-rich-grid-renderer",
            observeChannelShortsContent
        );
    } catch (error) {
        // Keep top-level error handling to prevent the extension from breaking
        console.error("Error setting up shorts click handlers:", error);
        throw error;
    }
};

/**
 * Observes and processes content sections for history and channel pages
 * @param element - The element to observe
 */
function observeShortsInItemSections(element: HTMLElement): void {
    const contents = element.querySelectorAll<HTMLElement>("#contents.ytd-item-section-renderer");
    contents.forEach(content => observeReelShelfRenderers(content));

    observerManager.observeChildNode(element, "YTD-ITEM-SECTION-RENDERER", node => {
        const contents = node.querySelectorAll<HTMLElement>("#contents.ytd-item-section-renderer");
        contents.forEach(content => observeReelShelfRenderers(content));
    });
}

/**
 * Sets up observers and click handlers for reel shelf renderers in the related section
 * @param element - The element to observe
 */
function observeReelShelfRenderers(element: HTMLElement): void {
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
    observerManager.observeChildNode(element, "YTD-REEL-SHELF-RENDERER", observeSection);
}

/**
 * Observes and processes content for channel shorts pages
 * @param element - The element to observe
 */
function observeChannelShortsContent(element: HTMLElement): void {
    applyClickHandlers(element);

    observerManager.observeChildNode(element, "YTD-RICH-ITEM-RENDERER", node => {
        applyClickHandlers(node);
    });
}

const applyClickHandlers = (element: HTMLElement) => {
    const buttons = element.querySelectorAll<HTMLElement>(SELECTORS.SHORTS_BUTTON);
    shortsHandler?.attachClickHandlers(buttons);
};

/**
 * Cleans up all observers and click handlers
 */
export const cleanup = (): void => {
    observerManager.cleanupAll();
    shortsHandler?.cleanup();
};
