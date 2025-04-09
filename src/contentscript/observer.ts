// Types
interface ObserverConfig {
    childList?: boolean;
    subtree?: boolean;
    attributes?: boolean;
    attributeFilter?: string[];
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

    /**
     * Creates an observer that watches for specific node types and applies a callback
     * @param element - The element to observe
     * @param nodeName - The name of the nodes to look for
     * @param callback - Function to call with matched nodes
     */
    observeChildNode(
        element: HTMLElement,
        nodeName: string,
        callback: (node: HTMLElement) => void
    ): void {
        this.createObserver(
            element,
            (mutations, _observer) => {
                for (const mutation of mutations) {
                    if (mutation.type !== "childList" || mutation.addedNodes.length === 0) {
                        continue;
                    }

                    for (const node of mutation.addedNodes) {
                        if (
                            node.nodeType !== Node.ELEMENT_NODE ||
                            node.nodeName !== nodeName
                        )
                            continue;

                        callback(node as HTMLElement);
                    }
                }
            },
            { childList: true }
        );
    }

    cleanupAll(): void {
        this.activeObservers.forEach(this.cleanupObserver.bind(this));
    }

    /**
     * Finds an element immediately if it exists, or sets up observation to find it when it appears.
     * If the element exists immediately, calls the callback right away.
     * Otherwise, sets up a MutationObserver to watch for the element to appear.
     * 
     * The method recursively observes parent elements until it finds the target.
     * For example, with selector "parent > child", it first observes "parent"
     * and then looks for "child" within it.
     * 
     * @param fullSelector - CSS selector to find the target element
     * @param callback - Function to call when the target element is found
     * @param condition - Optional function to determine if observation should continue
     */
    findOrObserveElement(
        fullSelector: string,
        callback: (element: HTMLElement) => void,
        condition: () => boolean = () => true
    ): void {
        // Check if element exists immediately
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

        const setupObserver = (element: HTMLElement) => {
            if (!config.subtree || condition()) {
                const target = element.querySelector<HTMLElement>(targetSelector);
                if (target) {
                    callback(target);
                    return;
                }
            }

            this.createObserver(
                element,
                (_mutations: MutationRecord[], observer: MutationObserver) => {
                    if (config.subtree && !condition()) {
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

        // Recursively observe parent elements until we find the target
        this.findOrObserveElement(parentSelector, setupObserver, condition);
    }
}
