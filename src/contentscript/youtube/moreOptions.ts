import { ObserverManager } from "../observer";
import { handleShortsItemFooter } from "./extraOptions/shortsItemFooter.js";
import { handleVideoItemFooter } from "./extraOptions/videoItemFooter.js";
import { ClickResult, getVideoInfo } from "./videoInfo";

export const extraOptionsClassName = "ytq-extra-options";
const dropdownSelector = "tp-yt-iron-dropdown.ytd-popup-container";
const dropdownFullSelector = `body > ytd-app > ytd-popup-container > ${dropdownSelector}`;

let optionClickResult: ClickResult | null = null;

const observerManager = new ObserverManager();

export function setOptionClickResult(result: ClickResult | null): void {
    optionClickResult = result;
}

export function getOptionClickResult(): ClickResult | null {
    return optionClickResult;
}

/**
 * Find the question menu in the shown dropdown
 * @returns {Element|null} The question button element if found, null otherwise
 */
export function findQuestionMenuShown(): Element | null {
    return document.querySelector(
        `${dropdownFullSelector}:not([aria-hidden='true']) .${extraOptionsClassName}:not([aria-hidden='true']) .option-item[target-value=question]`
    );
}

/**
 * Insert extra options ui into the footer of more options dropdown
 */
export function injectExtraOptions(): void {
    // for video item
    observerManager.findOrObserveElement(`body > ytd-app > ytd-popup-container`, container => {
        observeDropdown(container, handleVideoItemFooter);
    });

    // for shorts item
    observerManager.findOrObserveElement(`body > ytd-app > ytd-popup-container`, container => {
        observeDropdown(container, handleShortsItemFooter);
    });
}

/**
 * Observe the dropdown element and handle it when it is added to the DOM
 * @param {Element} container - The container element to observe
 * @param {Function} handler - Function to handle the dropdown node
 */
function observeDropdown(container: Element, handler: (node: Element) => boolean): void {
    observerManager.createObserver(
        container,
        (mutations: MutationRecord[], observer: MutationObserver) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (
                        node.nodeType !== Node.ELEMENT_NODE ||
                        !(node instanceof Element) ||
                        !node.matches(dropdownSelector)
                    ) {
                        continue;
                    }

                    if (!handler(node)) {
                        continue;
                    }

                    observerManager.cleanupObserver(observer);
                    return;
                }
            }
        },
        { childList: true }
    );
}

/**
 * Detects when a video option is clicked.
 */
export function detectVideoOptionClick(event: Event): void {
    const target = event.target;
    if (!(target instanceof Element) || target.tagName !== "DIV") {
        optionClickResult = null;
        return;
    }

    optionClickResult = getVideoInfo(target as HTMLElement) ?? null;
}
