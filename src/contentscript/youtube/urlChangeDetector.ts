/**
 * Class to detect URL changes in YouTube's single-page application.
 * Handles both history API changes and YouTube's client-side navigation.
 */
export class URLChangeDetector {
    private lastUrl: string;
    private onChange: ((location: Location) => void) | undefined;
    private navigationObserver: MutationObserver | null;

    constructor(onChange?: (location: Location) => void) {
        this.lastUrl = location.href;
        this.onChange = onChange;
        this.navigationObserver = null;
    }

    /**
     * Callback function that handles URL changes
     * @private
     */
    #onUrlChange = (): void => {
        const currentUrl = location.href;
        if (currentUrl !== this.lastUrl) {
            this.lastUrl = currentUrl;
            this.onChange?.(location);
        }
    };

    /**
     * Set up observers for YouTube's content container
     * @private
     */
    #setupNavigationObserver = (): void => {
        this.navigationObserver = new MutationObserver(() => {
            this.#onUrlChange();
        });

        const contentContainer = document.querySelector("ytd-app");
        if (contentContainer) {
            this.navigationObserver.observe(contentContainer, {
                childList: true,
                subtree: true,
            });
        }
    };

    /**
     * Initialize URL change detection
     */
    init(): void {
        // Listen for URL changes
        window.addEventListener("popstate", this.#onUrlChange);
        window.addEventListener("pushState", this.#onUrlChange);
        window.addEventListener("replaceState", this.#onUrlChange);

        // Intercept history methods
        const originalPushState = history.pushState;
        history.pushState = (...args: Parameters<typeof history.pushState>): void => {
            originalPushState.apply(history, args);
            this.#onUrlChange();
        };

        const originalReplaceState = history.replaceState;
        history.replaceState = (...args: Parameters<typeof history.replaceState>): void => {
            originalReplaceState.apply(history, args);
            this.#onUrlChange();
        };

        // Start observing navigation changes
        if (document.readyState === "loading") {
            document.addEventListener(
                "DOMContentLoaded",
                this.#setupNavigationObserver
            );
        } else {
            this.#setupNavigationObserver();
        }
    }

    /**
     * Clean up all event listeners and observers
     */
    destroy(): void {
        window.removeEventListener("popstate", this.#onUrlChange);
        window.removeEventListener("pushState", this.#onUrlChange);
        window.removeEventListener("replaceState", this.#onUrlChange);

        // Restore original history methods
        if (history.pushState.toString().includes("onUrlChange")) {
            history.pushState = Object.getPrototypeOf(history).pushState;
        }
        if (history.replaceState.toString().includes("onUrlChange")) {
            history.replaceState = Object.getPrototypeOf(history).replaceState;
        }

        // Disconnect observer
        if (this.navigationObserver) {
            this.navigationObserver.disconnect();
            this.navigationObserver = null;
        }

        document.removeEventListener(
            "DOMContentLoaded",
            this.#setupNavigationObserver
        );
    }
} 