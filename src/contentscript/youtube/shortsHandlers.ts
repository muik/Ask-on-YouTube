import { detectVideoOptionClick } from "./moreOptions";

// Constants
const SELECTORS = {
    SHORTS_BUTTON:
        "div.shortsLockupViewModelHostOutsideMetadataMenu div.yt-spec-touch-feedback-shape__fill",
} as const;

// Types
interface ObserverConfig {
    childList: boolean;
    subtree?: boolean;
}

type ObserverCallback = (mutations: MutationRecord[], observer: MutationObserver) => void;

/**
 * Manages MutationObserver instances and their cleanup
 */
class ObserverManager {
    private static instance: ObserverManager;
    private activeObservers = new Set<MutationObserver>();

    private constructor() {}

    static getInstance(): ObserverManager {
        if (!ObserverManager.instance) {
            ObserverManager.instance = new ObserverManager();
        }
        return ObserverManager.instance;
    }

    createObserver(
        target: Node,
        callback: ObserverCallback,
        config: ObserverConfig
    ): MutationObserver {
        const observer = new MutationObserver(callback);
        observer.observe(target, config);
        this.activeObservers.add(observer);
        return observer;
    }

    cleanupObserver(observer: MutationObserver): void {
        observer.disconnect();
        this.activeObservers.delete(observer);
    }

    cleanupAll(): void {
        this.activeObservers.forEach(this.cleanupObserver.bind(this));
    }
}

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

            ObserverManager.getInstance().createObserver(
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

            ObserverManager.getInstance().createObserver(
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
        observeWithSelector(
            "#page-manager > ytd-watch-flexy #related #items.yt-horizontal-list-renderer",
            applyClickHandlers
        );

        // for home page
        observeParent(
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
    ObserverManager.getInstance().cleanupAll();
    ShortsButtonHandler.getInstance().cleanup();
};

function observeWithSelector(fullSelector: string, callback: (element: HTMLElement) => void): void {
    const element = document.querySelector<HTMLElement>(fullSelector);
    const observe = (element: HTMLElement) => {
        callback(element);
        ObserverManager.getInstance().createObserver(
            element,
            (_mutations, _observer) => {
                callback(element);
            },
            {
                childList: true,
            }
        );
    };

    if (!element) {
        observeParent(fullSelector, observe);
        return;
    }

    observe(element);
}

function observeParent(fullSelector: string, callback: (element: HTMLElement) => void): void {
    console.debug("observeParent", fullSelector);
    const match = fullSelector.match(/(.*[^>\s])(\s*[>\s]+\s*)([^>\s]+)$/);

    let parentSelector;
    let separator;
    let targetSelector;

    if (!match) {
        if (fullSelector.includes("body")) {
            console.error("unexpected fullSelector", fullSelector);
            return;
        }
        parentSelector = "body";
        separator = " ";
        targetSelector = fullSelector;
    } else {
        parentSelector = match[1];
        separator = match[2];
        targetSelector = match[3];
    }

    const parent = document.querySelector<HTMLElement>(parentSelector);
    const config = { childList: true, subtree: true };

    if (separator.includes(">")) {
        config.subtree = false;
        targetSelector = `:scope > ${targetSelector}`;
    }

    const observe = (element: HTMLElement) => {
        console.debug("observing from observeParent", element, parentSelector);
        const observerManager = ObserverManager.getInstance();
        observerManager.createObserver(
            element,
            (_mutations, observer) => {
                const target = element.querySelector<HTMLElement>(targetSelector);
                if (target) {
                    callback(target);
                    observerManager.cleanupObserver(observer);
                    console.debug("cleanupObserver", parentSelector);
                }
            },
            config
        );
    };

    if (!parent) {
        observeParent(parentSelector, observe);
        return;
    }

    observe(parent);
}
