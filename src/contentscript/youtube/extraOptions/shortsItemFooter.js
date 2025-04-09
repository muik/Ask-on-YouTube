import { ObserverManager } from "../../observer.ts";
import {
    extraOptionsClassName,
    getOptionClickResult,
    setOptionClickResult,
} from "../moreOptions.js";
import { ClickElementType } from "../videoInfo.js";
import { createExtraOptionsContainer, insertQuestionMenuUseMark } from "./elements.js";

const observerManager = new ObserverManager();

/**
 * Handle finding and inserting extra options into the footer of a shorts item dropdown
 * @param {Element} node - The dropdown node element
 * @returns {boolean} - Returns true if footer was found and handled, false otherwise
 */
export function handleShortsItemFooter(dropdown) {
    const sheetViewModel = dropdown.querySelector("yt-sheet-view-model");
    if (!sheetViewModel) {
        return false;
    }

    observeShortsSheetViewModel(sheetViewModel);

    observerManager.createObserver(
        dropdown,
        mutations => {
            mutations.forEach(mutation => {
                const target = mutation.target;

                if (mutation.attributeName === "focused" && target.hasAttribute("focused")) {
                    const extraOptions = target.querySelector(`.${extraOptionsClassName}`);
                    if (!extraOptions) {
                        console.debug("extra options not found", target);
                        return;
                    }

                    const optionClickResult = getOptionClickResult();
                    if (!optionClickResult) {
                        console.debug("no option click result", target);
                        extraOptions.setAttribute("aria-hidden", true);
                        return;
                    }

                    const { videoInfo, type } = optionClickResult;
                    setOptionClickResult(null);

                    if (type === ClickElementType.NO_EXTRA_OPTIONS) {
                        extraOptions.setAttribute("aria-hidden", true);
                    }

                    extraOptions.dataset.videoInfoJson = JSON.stringify(videoInfo);
                }
            });
        },
        { attributeFilter: ["focused"] }
    );
    return true;
}

/**
 * Observes the sheet view model for YouTube Shorts dropdowns to insert extra options
 * @param {Element} sheetViewModel - The sheet view model element to observe
 */
function observeShortsSheetViewModel(sheetViewModel) {
    observerManager.createObserver(
        sheetViewModel,
        (mutations, observer) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== Node.ELEMENT_NODE) {
                        return;
                    }
                    const footer = node.querySelector(
                        ".yt-contextual-sheet-layout-wiz__footer-container"
                    );
                    if (!footer) {
                        return;
                    }

                    observerManager.cleanupObserver(observer);

                    const extraOptions = createExtraOptionsContainer();
                    footer.insertAdjacentElement("beforeend", extraOptions);
                    insertQuestionMenuUseMark(extraOptions);

                    // prevent the extra options from being removed
                    preventExtraOptionsRemoval(footer);
                });
            }
        },
        { childList: true }
    );
}

/**
 * Prevents extra options from being removed by recreating them when they are removed
 * @param {Element} footer - The footer element to observe
 */
function preventExtraOptionsRemoval(footer) {
    observerManager.createObserver(
        footer,
        mutations => {
            mutations.forEach(mutation => {
                if (mutation.removedNodes.length > 0) {
                    mutation.removedNodes.forEach(node => {
                        if (node.classList.contains(extraOptionsClassName)) {
                            const footer = mutation.target;
                            const extraOptions = createExtraOptionsContainer();
                            footer.insertAdjacentElement("beforeend", extraOptions);
                            insertQuestionMenuUseMark(extraOptions);
                        }
                    });
                }
            });
        },
        { childList: true }
    );
}
