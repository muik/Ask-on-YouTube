import { BackgroundActions } from "../../constants.js";
import { Errors } from "../../errors.js";
import { waitForElm } from "../utils.js";
import { setLoadingState } from "./extraOptionsView.js";
import { showQuestionDialog } from "./questionView.js";
import { getQuestionMarkSvg } from "./simpleQuestion.js";
import { showToastMessage } from "./toast.js";

const ClickElementType = {
    OTHER: 1, // not dropdown click
    NO_EXTRA_OPTIONS: 2, // the dropdown from this click should not show extra options
    UNEXPECTED: 3, // unexpected click type, should not happen
};

/**
 * @typedef {Object} VideoInfo
 * @property {string} id - The video ID
 * @property {string} title - The video title
 */

/**
 * @typedef {Object} ClickResult
 * @property {ClickElementType} [type] - The type of click event
 * @property {VideoInfo} [videoInfo] - The video information if available
 */

const extraOptionsClassName = "ytq-extra-options";
const dropdownSelector = "tp-yt-iron-dropdown.ytd-popup-container";
const focused = {};

/**
 * Insert extra options ui into the footer of more options dropdown
 */
export function insertExtraOptions() {
    // for video item
    waitForElm(`${dropdownSelector} #footer`).then(insertExtraOptionsToFooter);

    // for shorts item
    waitForElm(
        `${dropdownSelector} .yt-contextual-sheet-layout-wiz__footer-container`
    ).then(insertExtraOptionsToFooter);
}

function insertExtraOptionsToFooter(footerElement) {
    console.debug("Insert extra options to footer", footerElement);
    const dropDownElement = footerElement.closest(dropdownSelector);
    const optionItemClassName = "option-item";
    const questionText = chrome.i18n.getMessage("questionButtonText");
    const extraOptionsHTML = `
            <div class="ytq ${extraOptionsClassName}">
                <div class="vertical-menu ${optionItemClassName}" target-value="question">
                    <div class="icon">${getQuestionMarkSvg()}</div>
                    <span class="text">${questionText}</span>
                </div>
            </div>`.trim();

    footerElement.insertAdjacentHTML("beforeend", extraOptionsHTML);

    // Click event listener for the "View in Gemini" button
    dropDownElement
        .querySelectorAll(`.${extraOptionsClassName} .${optionItemClassName}`)
        .forEach((elm) => {
            elm.addEventListener("click", onExtraOptionClick);
        });
}

/**
 * Show extra options
 * @param {Element} dropDownElement - The YouTube video options menu.
 */
function showExtraOptions(dropDownElement) {
    const containerElement =
        dropDownElement.querySelector(`.ytq-extra-options`);
    if (!containerElement) {
        const footerElement =
            dropDownElement.querySelector("#footer") ||
            dropDownElement.querySelector(
                ".yt-contextual-sheet-layout-wiz__footer-container"
            );
        if (!footerElement) {
            console.warn(
                "No footer element found in dropDown",
                dropDownElement
            );
            return;
        }

        insertExtraOptionsToFooter(footerElement);
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

    if (!chrome.runtime || !chrome.runtime.sendMessage) {
        showToastMessage(Errors.EXTENSION_CONTEXT_INVALIDATED.message);
        return;
    }

    if (target === "question") {
        onQuestionClick(videoInfo);
        return;
    }

    setLoadingState(element, true);

    try {
        chrome.runtime.sendMessage(
            { action: BackgroundActions.SET_PROMPT, target: target, videoInfo },
            (response) => {
                onSetPrompt(response, element);
            }
        );
    } catch (error) {
        if (error.message === "Extension context invalidated.") {
            showToastMessage(Errors.EXTENSION_CONTEXT_INVALIDATED.message);
        } else {
            console.error("sendMessage setPrompt Error:", error);
            showToastMessage(`Unknown Error: ${error.message}`);
        }
        setLoadingState(element, false);
        return;
    }

    waitForElm(`${dropdownSelector}[aria-hidden='true']`).then(() => {
        setLoadingState(element, false);
    });
}

function onQuestionClick(videoInfo) {
    // Close the dropdown menu
    pressEscKey();

    showQuestionDialog(videoInfo);
}

function onSetPrompt(response, element) {
    // Stop when dropbox already closed, it means user doesn't want to continue.
    if (document.querySelector(`${dropdownSelector}[aria-hidden='true']`)) {
        return;
    }

    setLoadingState(element, false);

    if (chrome.runtime.lastError) {
        const errorMessage = `Error - ${
            chrome.runtime.lastError.message || chrome.runtime.lastError
        }`;
        console.error(
            "onSetPrompt chrome.runtime.lastError:",
            chrome.runtime.lastError
        );
        showToastMessage(errorMessage);
        return;
    }

    if (response.error) {
        const { code, message } = response.error;
        const error = Errors[code];
        if (error) {
            showToastMessage(error.message);
        } else {
            console.error("onSetPrompt Response Error:", response.error);
            showToastMessage(message);
        }
        return;
    }

    if (!response.targetUrl) {
        console.error("Error - targetUrl is not set.");
        showToastMessage("Error - targetUrl is not set.");
        return;
    }

    window.open(response.targetUrl, "_blank");

    // Close the dropdown menu
    pressEscKey();
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
 * Identify the video info from the YouTube video options menu.
 * @param {Element} target - The clicked element.
 * @returns {ClickResult | undefined} - The click result. If undefined, this is not the correct type of element and other options need to be considered.
 */
function getVideoInfoFromItemVideoOptionMenu(target) {
    if (
        !target.parentElement ||
        !target.parentElement.classList.contains("yt-icon")
    ) {
        // not this type of element, need to find other options
        return;
    }

    if (!target.closest("yt-icon-button.dropdown-trigger")) {
        return {
            type: ClickElementType.OTHER,
        };
    }

    // Locate the actual menu button on YouTube, often identified by certain attributes or classes.
    const menuButton = target.closest("ytd-menu-renderer");
    if (!menuButton) {
        console.debug("No menu button found", target);
        // Exit if the click did not occur on an options menu
        return {
            type: ClickElementType.OTHER,
        };
    }

    const skipClassNames = [
        "ytd-comment-view-model", // Comment option
        "ytd-reel-shelf-renderer", // Shorts container option
        "ytd-rich-shelf-renderer", // Shorts container option
    ];

    for (const className of skipClassNames) {
        if (menuButton.classList.contains(className)) {
            console.debug("Skip extra options", className);
            return {
                type: ClickElementType.NO_EXTRA_OPTIONS,
            }; // extra options should not be shown
        }
    }

    // Find the video container, which could be one of several YouTube element types
    const videoContainer =
        menuButton.closest("ytd-rich-item-renderer") || // Main video container
        menuButton.closest("ytd-video-renderer") ||
        menuButton.closest("ytd-compact-video-renderer") ||
        menuButton.closest("ytd-playlist-panel-video-renderer") ||
        menuButton.closest("ytd-playlist-video-renderer") ||
        menuButton.closest("ytd-grid-video-renderer");
    if (!videoContainer) {
        console.debug("No video container found", menuButton);
        return {
            type: ClickElementType.OTHER,
        }; // Exit if no video container is identified
    }

    // Locate an <a> tag within the container that links to the video
    const linkElement = videoContainer.querySelector("a#thumbnail");
    if (!linkElement || !linkElement.href) {
        console.debug("No video link found", videoContainer);
        return {
            type: ClickElementType.OTHER,
        };
    }

    const titleElement = videoContainer.querySelector("#video-title");
    if (!titleElement || !titleElement.textContent) {
        console.debug("No video title found", videoContainer);
        return {
            type: ClickElementType.OTHER,
        }; // Exit if no video title is identified
    }

    // Extract the video ID from the URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)
    const url = new URL(linkElement.href);
    const id = url.searchParams.get("v");
    const title = titleElement.textContent.trim();

    return {
        videoInfo: {
            id: id,
            title: title,
        },
    };
}

/**
 * Extracts the video ID from the main YouTube video options menu.
 * @param {Element} target - The clicked element.
 * @returns {ClickResult | undefined} - The click result. If undefined, this is not the correct type of element and other options need to be considered.
 */
function getVideoInfoFromMainVideoOptionMenu(target) {
    if (!target.classList.contains("yt-spec-touch-feedback-shape__fill")) {
        // not this type of element, need to find other options
        return;
    }

    if (target.closest("div.shortsLockupViewModelHostOutsideMetadataMenu")) {
        return getVideoInfoFromShortsItem(target);
    }

    if (!target.closest("#button-shape")) {
        return {
            type: ClickElementType.OTHER,
        };
    }

    // check if the url is a shorts detail page like https://www.youtube.com/shorts/VIDEO_ID
    if (window.location.pathname.startsWith("/shorts/")) {
        return getVideoInfoFromShortsDetail(target);
    }

    return getVideoInfoFromVideoDetail();
}

/**
 * Extracts the video ID from the shorts item.
 * @param {Element} target - The clicked element.
 * @returns {ClickResult | undefined} - The click result. If undefined, this is not the correct type of element and other options need to be considered.
 */
function getVideoInfoFromShortsItem(target) {
    const selector = "ytm-shorts-lockup-view-model";
    const container = target.closest(selector);
    if (!container) {
        console.debug(`No container found for selector ${selector}`, target);
        return {
            type: ClickElementType.UNEXPECTED,
        };
    }

    const linkElement = container.querySelector("h3 a");
    return getVideoInfoFromShortsLinkElement(linkElement);
}

/**
 * Extracts the video ID from the shorts detail page.
 * @param {Element} target - The clicked element.
 * @returns {ClickResult | undefined} - The click result. If undefined, this is not the correct type of element and other options need to be considered.
 */
function getVideoInfoFromShortsDetail(target) {
    const linkElement = target
        .closest("ytd-reel-video-renderer")
        ?.querySelector("a.ytp-title-link");
    return getVideoInfoFromShortsLinkElement(linkElement);
}

/**
 * Extracts the video info from the link element.
 * @param {Element} linkElement - The link element.
 * @returns {ClickResult | undefined} - The click result. If undefined, this is not the correct type of element and other options need to be considered.
 */
function getVideoInfoFromShortsLinkElement(linkElement) {
    if (!linkElement || !linkElement.href) {
        console.debug("No link element found", linkElement);
        return {
            type: ClickElementType.UNEXPECTED,
        };
    }

    const id = getVideoIdFromShortsUrl(linkElement.href);
    const title = linkElement.textContent.trim();

    return {
        videoInfo: {
            id,
            title,
        },
    };
}

/**
 * Extracts the video info from the YouTube video detail page.
 * @returns {ClickResult | undefined} - The click result. If undefined, this is not the correct type of element and other options need to be considered.
 */
export function getVideoInfoFromVideoDetail() {
    const titleElement = document.querySelector("#title > h1");
    if (!titleElement || !titleElement.textContent) {
        console.error("No title element found", document);
        return {
            type: ClickElementType.UNEXPECTED,
        };
    }

    // url like https://www.youtube.com/watch?v=VIDEO_ID
    // get the v param from the url
    const url = new URL(window.location.href);
    const id = url.searchParams.get("v");
    const title = titleElement.textContent.trim();

    return {
        videoInfo: {
            id,
            title,
        },
    };
}

/**
 * Detects when a video option is clicked.
 */
export function detectVideoOptionClick(target) {
    if (target.tagName != "DIV") {
        return;
    }

    const result =
        getVideoInfoFromItemVideoOptionMenu(target) ||
        getVideoInfoFromMainVideoOptionMenu(target);

    if (!result) {
        return;
    }

    const { videoInfo, type } = result;

    // for example, when the more options of comments is clicked
    if (!videoInfo) {
        if (type === ClickElementType.NO_EXTRA_OPTIONS) {
            const containerElement = document.querySelector(
                `${dropdownSelector} ytd-menu-popup-renderer .${extraOptionsClassName}`
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
    waitForElm(`${dropdownSelector}:not([aria-hidden='true'])`).then(
        (dropdown) => {
            showExtraOptions(dropdown);
        }
    );
}

/**
 * Extracts the video ID from the shorts URL.
 * get the last pathname without query params
 * @param {string} link - The shorts URL. like https://www.youtube.com/shorts/VIDEO_ID
 * @returns {string} The video ID.
 */
function getVideoIdFromShortsUrl(link) {
    const url = new URL(link);
    return url.pathname.split("/")[2];
}
