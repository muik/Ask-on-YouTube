// Types
interface ObserverConfig {
    childList: boolean;
    subtree?: boolean;
    attributes?: boolean;
}

type ObserverCallback = (mutations: MutationRecord[], observer: MutationObserver) => void;

interface ParsedSelector {
    parentSelector: string;
    separator: string;
    targetSelector: string;
}

/**
 * Parses a CSS selector into its parent, separator, and target components
 * @param fullSelector The full CSS selector to parse
 * @returns Parsed selector components or null if invalid
 */
function parseSelector(fullSelector: string): ParsedSelector {
    const match = fullSelector.match(/(.*[^>\s])(\s*[>\s]+\s*)([^>\s]+)$/);

    if (!match) {
        if (fullSelector.includes("body")) {
            throw new Error(`Unexpected fullSelector: ${fullSelector}`);
        }
        return {
            parentSelector: "body",
            separator: " ",
            targetSelector: fullSelector
        };
    }

    return {
        parentSelector: match[1],
        separator: match[2],
        targetSelector: match[3]
    };
}

/**
 * Manages MutationObserver instances and their cleanup
 */
export class ObserverManager {
    private activeObservers = new Set<MutationObserver>();

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

    /**
     * Observes an element matching the given selector, applies a callback,
     * and continues monitoring the element for changes to its child elements only
     * @param fullSelector The CSS selector to match
     * @param callback Function to call when the target element is found
     */
    observeWithSelector(fullSelector: string, callback: (element: HTMLElement) => void): void {
        const element = document.querySelector<HTMLElement>(fullSelector);
        const observe = (element: HTMLElement) => {
            callback(element);
            this.createObserver(
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
            this.observeParent(fullSelector, observe);
            return;
        }

        observe(element);
    }

    /**
     * Observes a parent element for a target element matching the given selector
     * and stops observing when the target element is found
     * if the target element is found, the callback is called and the observer is cleaned up
     * else the observer continues to observe the parent element for changes to its child elements
     * @param fullSelector The full CSS selector to match
     * @param callback Function to call when the target element is found
     * @param condition Function to determine if observing should continue to be performed
     */
    observeParent(
        fullSelector: string,
        callback: (element: HTMLElement) => void,
        condition: () => boolean = () => true
    ): void {
        const target = document.querySelector<HTMLElement>(fullSelector);
        if (target) {
            callback(target);
            return;
        }

        const parsed = parseSelector(fullSelector);
        const { parentSelector, separator } = parsed;
        let { targetSelector } = parsed;
        const config = { childList: true, subtree: true };

        if (separator.includes(">")) {
            config.subtree = false;
            targetSelector = `:scope > ${targetSelector}`;
        }

        const observe = (element: HTMLElement) => {
            if (condition()) {
                const target = element.querySelector<HTMLElement>(targetSelector);
                if (target) {
                    console.debug("found target", target, parentSelector, targetSelector);
                    callback(target);
                    return;
                }
            }

            this.createObserver(
                element,
                (_mutations: MutationRecord[], observer: MutationObserver) => {
                    if (!condition()) {
                        return;
                    }

                    const target = element.querySelector<HTMLElement>(targetSelector);
                    if (target) {
                        callback(target);
                        this.cleanupObserver(observer);
                    }
                },
                config
            );
        };

        this.observeParent(parentSelector, observe, condition);
    }
}
