import { BackgroundActions } from "../../constants.js";
import { Errors } from "../../errors.js";
import { ObserverManager } from "../observer.ts";
import { showQuestionDialog } from "./questionView.js";
import { getQuestionMarkSvg } from "./simpleQuestion.js";
import { showToastMessage } from "./toast.js";
import { ClickElementType, getVideoInfo } from "./videoInfo.js";

const extraOptionsClassName = "ytq-extra-options";
const dropdownSelector = "tp-yt-iron-dropdown.ytd-popup-container";
const dropdownFullSelector = `body > ytd-app > ytd-popup-container > ${dropdownSelector}`;

const useMarkElements = [];
let questionMenuUsedBefore;
let optionClickResult = null;

const observerManager = new ObserverManager();

/**
 * Find the question menu in the shown dropdown
 * @returns {Element|null} The question button element if found, null otherwise
 */
export function findQuestionMenuShown() {
    return document.querySelector(
        `${dropdownFullSelector}:not([aria-hidden='true']) .${extraOptionsClassName}:not([aria-hidden='true']) .option-item[target-value=question]`
    );
}

/**
 * Insert extra options ui into the footer of more options dropdown
 */
export function injectExtraOptions() {
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
function observeDropdown(container, handler) {
    observerManager.createObserver(
        container,
        (mutations, observer) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE || !node.matches(dropdownSelector)) {
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
 * Handle finding and inserting extra options into the footer of a video item dropdown
 * @param {Element} node - The dropdown node element
 * @returns {boolean} - Returns true if footer was found and handled, false otherwise
 */
function handleVideoItemFooter(dropdown) {
    const footer = dropdown.querySelector(`ytd-menu-popup-renderer #footer`);
    if (!footer) {
        return false;
    }
    const extraOptions = createExtraOptionsContainer();
    footer.insertAdjacentElement("beforeend", extraOptions);
    insertQuestionMenuUseMark(extraOptions);

    observerManager.createObserver(
        dropdown,
        mutations => {
            mutations.forEach(mutation => {
                const target = mutation.target;
                const extraOptions = target.querySelector(`.${extraOptionsClassName}`);
                if (!extraOptions) {
                    console.debug("extra options not found", target);
                    return;
                }

                if (
                    mutation.attributeName === "aria-hidden" &&
                    target.getAttribute("aria-hidden") === "true"
                ) {
                    // to determine the extra options is hidden or not when the dropdown focused
                    extraOptions.removeAttribute("aria-hidden");
                    return;
                }

                if (mutation.attributeName === "focused" && target.hasAttribute("focused")) {
                    if (!optionClickResult) {
                        console.debug("no option click result", target);
                        extraOptions.setAttribute("aria-hidden", true);
                        return;
                    }

                    const { videoInfo, type } = optionClickResult;
                    optionClickResult = null;

                    if (type === ClickElementType.NO_EXTRA_OPTIONS) {
                        extraOptions.setAttribute("aria-hidden", true);
                    }

                    extraOptions.dataset.videoInfoJson = JSON.stringify(videoInfo);
                }
            });
        },
        { attributeFilter: ["focused", "aria-hidden"] }
    );
    return true;
}

/**
 * Handle finding and inserting extra options into the footer of a shorts item dropdown
 * @param {Element} node - The dropdown node element
 * @returns {boolean} - Returns true if footer was found and handled, false otherwise
 */
function handleShortsItemFooter(dropdown) {
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
                    if (!optionClickResult) {
                        console.debug("no option click result", target);
                        extraOptions.setAttribute("aria-hidden", true);
                        return;
                    }

                    const { videoInfo, type } = optionClickResult;
                    optionClickResult = null;

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

const questionText = chrome.i18n.getMessage("questionButtonText");
const shortcutTooltip = chrome.i18n.getMessage("questionShortcutTooltip");

function createExtraOptionsContainer() {
    const optionItemClassName = "option-item";
    const container = document.createElement("div");
    container.classList.add("ytq");
    container.classList.add(extraOptionsClassName);
    container.innerHTML = `
            <div class="vertical-menu ${optionItemClassName}" target-value="question">
                <div class="icon">${getQuestionMarkSvg()}</div>
                <span class="text">${questionText}</span>
                <span class="shortcut" title="${shortcutTooltip}">q</span>
            </div>`.trim();

    // Click event listener for the "View in Gemini" button
    container.querySelectorAll(`.${optionItemClassName}`).forEach(elm => {
        elm.addEventListener("click", onExtraOptionClick);
    });

    return container;
}

async function insertQuestionMenuUseMark(container) {
    if (questionMenuUsedBefore === undefined) {
        try {
            const response = await chrome.runtime.sendMessage({
                action: BackgroundActions.GET_QUESTION_MENU_USED_BEFORE,
            });
            questionMenuUsedBefore = response.usedBefore;
        } catch (error) {
            if (error.message === "Extension context invalidated.") {
                // ignore the error
                return;
            }
            throw error;
        }
    }

    if (questionMenuUsedBefore) {
        return;
    }

    const element = document.createElement("div");
    element.classList.add("use-mark");

    container.querySelector(".vertical-menu").insertAdjacentElement("beforeend", element);

    useMarkElements.push(element);
}

async function removeQuestionMenuUseMark() {
    if (useMarkElements.length === 0) {
        return;
    }

    useMarkElements.forEach(element => {
        element.remove();
    });
    useMarkElements.length = 0;
    questionMenuUsedBefore = true;

    try {
        const response = await chrome.runtime.sendMessage({
            action: BackgroundActions.SET_QUESTION_MENU_USED_BEFORE,
        });
        if (!response.success) {
            console.error("removeQuestionMenuUseMark failed:", response);
        }
    } catch (error) {
        console.error("removeQuestionMenuUseMark Error:", error);
    }
}

/**
 * Event listener for the extra options.
 * @param {Event} e
 */
function onExtraOptionClick(e) {
    e.stopPropagation();
    const element = e.target;

    const target =
        element.getAttribute("target-value") ||
        element.closest("[target-value]").getAttribute("target-value");

    const targets = ["chatgpt", "gemini", "question"];
    if (!targets.includes(target)) {
        console.error("Invalid option clicked.", e.target);
        return;
    }

    const container = element.closest(`.${extraOptionsClassName}`);
    const videoInfo = JSON.parse(container.dataset.videoInfoJson);
    if (!videoInfo) {
        console.error("No video info found", container);
        showToastMessage(Errors.UNKNOWN_ERROR.message);
        return;
    }

    if (!chrome.runtime || !chrome.runtime.sendMessage) {
        showToastMessage(Errors.EXTENSION_CONTEXT_INVALIDATED.message);
        return;
    }

    if (target === "question") {
        onQuestionClick(videoInfo);
        return;
    }

    console.error("Invalid option clicked.", e.target);
}

function onQuestionClick(videoInfo) {
    // Close the dropdown menu
    pressEscKey();

    try {
        showQuestionDialog(videoInfo);
        removeQuestionMenuUseMark();
    } catch (error) {
        if (error.code in Errors) {
            showToastMessage(error.message);
            return;
        }
        console.error("onQuestionClick error:", error);
        showToastMessage(Errors.UNKNOWN_ERROR.message);
    }
}

/**
 * Dispatch the ESC key press event on the document
 */
function pressEscKey() {
    // Create a new keyboard event
    const escEvent = new KeyboardEvent("keydown", {
        key: "Escape", // Key value
        code: "Escape", // Code for the Escape key
        keyCode: 27, // Deprecated, but some old browsers still use this
        which: 27, // Deprecated, but included for compatibility
        bubbles: true, // Allow the event to bubble up through the DOM
        cancelable: true, // The event can be canceled
    });

    // Dispatch the event on the document or a specific element
    document.dispatchEvent(escEvent);
}

/**
 * Detects when a video option is clicked.
 */
export function detectVideoOptionClick(event) {
    const target = event.target;
    if (target.tagName != "DIV") {
        optionClickResult = null;
        return;
    }

    optionClickResult = getVideoInfo(target);
}
