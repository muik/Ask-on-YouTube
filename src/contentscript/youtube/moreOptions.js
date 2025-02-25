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

const useMarkElements = [];
let questionMenuUsedBefore;

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
    const container = createExtraOptionsContainer();
    footerElement.insertAdjacentElement("beforeend", container);

    const observer = new MutationObserver((mutations, observer) => {
        mutations.forEach((mutation) => {
            if (mutation.removedNodes.length > 0) {
                mutation.removedNodes.forEach((node) => {
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
    const container = document.createElement("div");
    container.classList.add("ytq");
    container.classList.add(extraOptionsClassName);
    container.innerHTML = `
            <div class="vertical-menu ${optionItemClassName}" target-value="question">
                <div class="icon">${getQuestionMarkSvg()}</div>
                <span class="text">${questionText}</span>
            </div>`.trim();

    // Click event listener for the "View in Gemini" button
    container.querySelectorAll(`.${optionItemClassName}`).forEach((elm) => {
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

    container
        .querySelector(".vertical-menu")
        .insertAdjacentElement("beforeend", element);

    useMarkElements.push(element);
}

async function removeQuestionMenuUseMark() {
    if (useMarkElements.length === 0) {
        return;
    }

    useMarkElements.forEach((element) => {
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
    const containerElement = dropDownElement.querySelector(
        `.${extraOptionsClassName}`
    );
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
            if (!error.code) {
                console.error("sendMessage setPrompt Error:", error);
            }
            showToastMessage(error.message);
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
    removeQuestionMenuUseMark();
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

    // find the class name like ytd-*-renderer
    const rendererClassName = Array.from(menuButton.classList).find(
        (className) => className.startsWith("ytd-")
    );
    if (!rendererClassName) {
        console.debug("No renderer class name found", menuButton);
        return {
            type: ClickElementType.OTHER,
        }; // Exit if no renderer class name is identified
    }

    // Find the video container, which could be one of several YouTube element types
    const videoContainer = menuButton.closest(rendererClassName);
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

    const thumbnailElement = videoContainer.querySelector("img.yt-core-image");
    if (!thumbnailElement) {
        console.debug("No thumbnail element found", videoContainer);
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
    const thumbnail = thumbnailElement?.src;

    return {
        videoInfo: {
            id: id,
            title: title,
            thumbnail: thumbnail,
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

    // for shorts item on home page
    if (
        target.parentElement.parentElement.parentElement.parentElement.classList.contains(
            "shortsLockupViewModelHostOutsideMetadataMenu"
        )
    ) {
        return getVideoInfoFromShortsItem(target);
    }

    const menuButton = target.closest("ytd-menu-renderer");
    if (!menuButton) {
        console.debug("No menu button found", target);
        return {
            type: ClickElementType.OTHER,
        };
    }

    const rendererClassName = Array.from(menuButton.classList).find(
        (className) => className.startsWith("ytd-")
    );
    if (!rendererClassName) {
        console.debug("No renderer class name found", menuButton);
        return {
            type: ClickElementType.OTHER,
        };
    }

    // for video detail page
    if (rendererClassName === "ytd-watch-metadata") {
        return {
            videoInfo: getVideoInfoFromVideoDetail(),
        };
    }

    if (rendererClassName.includes("-reel-")) {
        // check if the url is a shorts detail page like https://www.youtube.com/shorts/VIDEO_ID
        if (window.location.pathname.startsWith("/shorts/")) {
            const videoContainer = target.closest(rendererClassName);
            if (!videoContainer) {
                console.debug("No video container found", target);
                return {
                    type: ClickElementType.OTHER,
                };
            }
            return getVideoInfoFromShortsDetail(videoContainer);
        }
    }

    console.debug("No renderer class name found", rendererClassName);
    return {
        type: ClickElementType.OTHER,
    };
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
    const thumbnailElement = container.querySelector("img.yt-core-image");

    return getVideoInfoFromShortsLinkElement(linkElement, thumbnailElement);
}

/**
 * Extracts the video ID from the shorts detail page.
 * @param {Element} rendererElement - The renderer element.
 * @returns {ClickResult | undefined} - The click result. If undefined, this is not the correct type of element and other options need to be considered.
 */
function getVideoInfoFromShortsDetail(videoContainer) {
    const linkElement = videoContainer.querySelector("a.ytp-title-link");
    const thumbnailElement = null; // no thumbnail for shorts detail page

    return getVideoInfoFromShortsLinkElement(linkElement, thumbnailElement);
}

/**
 * Extracts the video info from the link element.
 * @param {Element} linkElement - The link element.
 * @returns {ClickResult | undefined} - The click result. If undefined, this is not the correct type of element and other options need to be considered.
 */
function getVideoInfoFromShortsLinkElement(
    linkElement,
    thumbnailElement = null
) {
    if (!linkElement || !linkElement.href) {
        console.debug("No link element found", linkElement);
        return {
            type: ClickElementType.UNEXPECTED,
        };
    }

    const id = getVideoIdFromShortsUrl(linkElement.href);
    const title = linkElement.textContent.trim();
    const thumbnail = thumbnailElement?.src;

    return {
        videoInfo: {
            id,
            title,
            thumbnail,
        },
    };
}

/**
 * Extracts the video info from the YouTube video detail page.
 * @returns {VideoInfo} - The video info.
 */
export function getVideoInfoFromVideoDetail() {
    const titleElement = document.querySelector("#title > h1");
    if (!titleElement || !titleElement.textContent) {
        console.error("No title element found on video detail page", document);
        throw Errors.UNKNOWN_ERROR;
    }

    // url like https://www.youtube.com/watch?v=VIDEO_ID
    // get the v param from the url
    const url = new URL(window.location.href);
    const id = url.searchParams.get("v");
    const title = titleElement.textContent.trim();

    return {
        id,
        title,
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
