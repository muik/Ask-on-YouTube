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

/**
 * Get the search parameters from a string
 * @param {string} str - The string to get the search parameters from
 * @returns {Object} - The search parameters
 */
export function getSearchParam(str) {
    const searchParam = str && str !== "" ? str : window.location.search;

    if (!/\?([a-zA-Z0-9_]+)/i.exec(searchParam)) return {};
    let match,
        pl = /\+/g, // Regex for replacing addition symbol with a space
        search = /([^?&=]+)=?([^&]*)/g,
        decode = function (s) {
            return decodeURIComponent(s.replace(pl, " "));
        },
        index = /\?([a-zA-Z0-9_]+)/i.exec(searchParam)["index"] + 1,
        query = searchParam.substring(index);

    let urlParams = {};
    while ((match = search.exec(query)) !== null) {
        urlParams[decode(match[1])] = decode(match[2]);
    }
    return urlParams;
}
