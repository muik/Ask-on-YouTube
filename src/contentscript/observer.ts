// Types
interface ObserverConfig {
    childList: boolean;
    subtree?: boolean;
    attributes?: boolean;
}

type ObserverCallback = (mutations: MutationRecord[], observer: MutationObserver) => void;

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
     * @param fullSelector The full CSS selector to match
     * @param callback Function to call when the target element is found
     */
    observeParent(fullSelector: string, callback: (element: HTMLElement) => void): void {
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
            this.createObserver(
                element,
                (_mutations: MutationRecord[], observer: MutationObserver) => {
                    const target = element.querySelector<HTMLElement>(targetSelector);
                    if (target) {
                        callback(target);
                        this.cleanupObserver(observer);
                        console.debug("cleanupObserver", parentSelector);
                    }
                },
                config
            );
        };

        if (!parent) {
            this.observeParent(parentSelector, observe);
            return;
        }

        const target = parent.querySelector<HTMLElement>(targetSelector);
        if (target) {
            callback(target);
            return;
        }

        observe(parent);
    }
}
