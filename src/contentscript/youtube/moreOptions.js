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
const focused = {};

const useMarkElements = [];
let questionMenuUsedBefore;

const observerManager = new ObserverManager();

/**
 * Find the question menu in the shown dropdown
 * @returns {Element|null} The question button element if found, null otherwise
 */
export function findQuestionMenuShown() {
    return document.querySelector(
        `${dropdownFullSelector}:not([aria-hidden='true']) .${extraOptionsClassName} .option-item[target-value=question]`
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
function handleVideoItemFooter(node) {
    const footer = node.querySelector(`ytd-menu-popup-renderer #footer`);
    if (!footer) {
        return false;
    }

    insertExtraOptionsToFooter(footer);
    return true;
}

/**
 * Handle finding and inserting extra options into the footer of a shorts item dropdown
 * @param {Element} node - The dropdown node element
 * @returns {boolean} - Returns true if footer was found and handled, false otherwise
 */
function handleShortsItemFooter(node) {
    const sheetViewModel = node.querySelector("yt-sheet-view-model");
    if (!sheetViewModel) {
        return false;
    }

    observerManager.createObserver(
        sheetViewModel,
        (mutations, observer) => {
            const footer = sheetViewModel.querySelector(
                ".yt-contextual-sheet-layout-wiz__footer-container"
            );
            if (!footer) {
                return;
            }

            insertExtraOptionsToFooter(footer);
            observerManager.cleanupObserver(observer);
        },
        { childList: true, subtree: true }
    );
    return true;
}

function insertExtraOptionsToFooter(footerElement) {
    const container = createExtraOptionsContainer();
    footerElement.insertAdjacentElement("beforeend", container);

    const observer = new MutationObserver((mutations, observer) => {
        mutations.forEach(mutation => {
            if (mutation.removedNodes.length > 0) {
                mutation.removedNodes.forEach(node => {
                    if (node.classList.contains(extraOptionsClassName)) {
                        observer.disconnect();
                        insertExtraOptionsToFooter(footerElement);
                    }
                });
            }
        });
    });
    observer.observe(footerElement, { childList: true });

    insertQuestionMenuUseMark(container);
}

function createExtraOptionsContainer() {
    const optionItemClassName = "option-item";
    const questionText = chrome.i18n.getMessage("questionButtonText");
    const shortcutTooltip = chrome.i18n.getMessage("questionShortcutTooltip");
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
        const response = await chrome.runtime.sendMessage({
            action: BackgroundActions.GET_QUESTION_MENU_USED_BEFORE,
        });
        questionMenuUsedBefore = response.usedBefore;
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
 * Show extra options
 * @param {Element} dropDownElement - The YouTube video options menu.
 */
function showExtraOptions(dropDownElement) {
    const containerElement = dropDownElement.querySelector(`.${extraOptionsClassName}`);
    if (!containerElement) {
        console.error("No extra options container found", dropDownElement);
        return;
    }

    containerElement.removeAttribute("aria-hidden");
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

    const videoInfo = focused.videoInfo;
    if (!videoInfo) {
        console.error("No video info found", focused);
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

    showQuestionDialog(videoInfo);
    removeQuestionMenuUseMark();
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
        return;
    }

    const result = getVideoInfo(target);

    if (!result) {
        return;
    }

    const { videoInfo, type } = result;

    // for example, when the more options of comments is clicked
    if (!videoInfo) {
        if (type === ClickElementType.NO_EXTRA_OPTIONS) {
            const containerElement = document.querySelector(
                `${dropdownFullSelector} ytd-menu-popup-renderer .${extraOptionsClassName}`
            );
            if (containerElement) {
                containerElement.setAttribute("aria-hidden", true);
            }
        }
        return;
    }

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoInfo.id)) {
        console.warn("Invalid video ID.", videoInfo.id, target);
        return;
    }

    focused.videoInfo = videoInfo;

    // TODO set timeout
    observerManager.findOrObserveElement(`${dropdownFullSelector}:not([aria-hidden='true'])`, dropdown => {
        showExtraOptions(dropdown);
    });
}
