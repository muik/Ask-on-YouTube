/**
 * Wait for an element to be added to the DOM
 * @param {string} selector - CSS selector
 * @returns {Promise} - Promise that resolves when the element is added
 * @example
 * waitForElm(".my-element").then(element => {
 *    console.log("Element added", element);
 * });
 */
export function waitForElm(selector) {
    return new Promise((resolve) => {
        const existingElement = document.querySelector(selector);
        if (existingElement) {
            return resolve(existingElement);
        }

        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    });
}

/**
 * Watch for an element to be added to the DOM
 * @param {Object} options - Options for the watcher
 * @param {string} options.selector - CSS selector
 * @param {function} options.callback - Callback function
 * @param {boolean} [options.once=false] - Whether to watch only once
 * @returns {MutationObserver} - The MutationObserver instance
 */
export function watchElement({ selector, callback, once = false }) {
    const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
            callback(element);
            if (once) {
                observer.disconnect();
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    return observer;
}
