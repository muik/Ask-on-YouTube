import { Errors, handleSendMessageError } from "../../errors.js";
import { getSearchParam } from "../searchParam.js";
import { waitForElm } from "../utils.js";
import { setLoadingState } from "./extraOptionsView.js";
import { showQuestionDialog } from "./questionView.js";
import { showToastMessage } from "./toast.js";

const extraOptionsContainerId = "extra-options";
const dropdownSelector = "tp-yt-iron-dropdown.ytd-popup-container";

/**
 * Insert extra options ui into the footer of more options dropdown
 */
export function insertExtraOptions() {
    waitForElm(dropdownSelector).then((dropDownElement) => {
        console.debug("Add extra options container.");
        const optionItemClassName = "option-item";
        const extraOptionsHTML = `
                        <div id="${extraOptionsContainerId}">
                            <div class="horizontal-menu">
                                <div class="${optionItemClassName}" target-value="chatgpt">ChatGPT</div>
                                <div class="${optionItemClassName}" target-value="gemini">Gemini</div>
                                <div class="${optionItemClassName}" target-value="question">Question</div>
                            </div>
                        </div>`;

        const footerElement = dropDownElement.querySelector("#footer");
        footerElement.insertAdjacentHTML("beforeend", extraOptionsHTML);

        // Click event listener for the "View in Gemini" button
        const containerElement = dropDownElement.querySelector(
            `#${extraOptionsContainerId}`
        );
        containerElement
            .querySelectorAll(`.${optionItemClassName}`)
            .forEach((elm) => {
                elm.addEventListener("click", onExtraOptionClick);
            });
    });
}

/**
 * Update extra options
 * @param {Element} dropDownElement - The YouTube video options menu.
 * @param {VideoInfo} videoInfo - The YouTube video Info.
 */
function updateExtraOptions(dropDownElement, videoInfo) {
    console.debug("Update extra options:", dropDownElement, videoInfo);
    const containerSelector = `#${extraOptionsContainerId}`;
    const containerElement = dropDownElement.querySelector(containerSelector);
    containerElement.setAttribute("video-id", videoInfo.id);
    containerElement.setAttribute("video-title", videoInfo.title);
    containerElement.setAttribute("video-thumbnail", videoInfo.thumbnail);
    containerElement.removeAttribute("aria-hidden");
}

/**
 * Event listener for the extra options.
 * @param {Event} e
 */
function onExtraOptionClick(e) {
    e.stopPropagation();
    const element = e.target;

    const target = element.getAttribute("target-value");

    const targets = ["chatgpt", "gemini", "question"];
    if (!targets.includes(target)) {
        console.error("Invalid option clicked.", e.target);
        return;
    }

    const containerElement = e.target.closest(`#${extraOptionsContainerId}`);
    const videoInfo = {
        id: containerElement.getAttribute("video-id"),
        title: containerElement.getAttribute("video-title"),
        thumbnail: containerElement.getAttribute("video-thumbnail"),
    };

    if (!chrome.runtime || !chrome.runtime.sendMessage) {
        showToastMessage(Errors.EXTENSION_CONTEXT_INVALIDATED);
        return;
    }

    if (target === "question") {
        onQuestionClick(videoInfo);
        return;
    }

    setLoadingState(element, true);

    try {
        chrome.runtime.sendMessage(
            { message: "setPrompt", target: target, videoInfo },
            (response) => {
                onSetPrompt(response, element);
            }
        );
    } catch (error) {
        if (!handleSendMessageError(error)) {
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
        console.error("Error setting prompt.", chrome.runtime.lastError);
        showToastMessage(errorMessage);
        return;
    }

    if (response.error) {
        const { code, message } = response.error;
        if (code === "TRANSCRIPT_NOT_FOUND") {
            showToastMessage(message);
        } else {
            const errorMessage = `Error - code: ${code}`;
            console.error("Error setting prompt.", response.error);
            showToastMessage(errorMessage);
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
 * Extracts the video ID from the YouTube video options menu.
 * @param {Element} target - The clicked element.
 * @returns {VideoInfo} The YouTube video Info.
 */
function getVideoInfoFromItemVideoOptionMenu(target) {
    if (
        target.tagName != "DIV" ||
        !target.parentElement ||
        !target.parentElement.classList.contains("yt-icon")
    ) {
        return;
    }

    if (!target.closest("yt-icon-button.dropdown-trigger")) {
        return;
    }

    // Locate the actual menu button on YouTube, often identified by certain attributes or classes.
    const menuButton = target.closest("ytd-menu-renderer");
    if (!menuButton) {
        console.debug("No menu button found", target);
        return; // Exit if the click did not occur on an options menu
    }

    const skipClassNames = [
        "ytd-comment-view-model", // Comment option
        "ytd-reel-shelf-renderer", // Shorts container option
        "ytd-rich-shelf-renderer", // Shorts container option
    ];

    for (const className of skipClassNames) {
        if (menuButton.classList.contains(className)) {
            return;
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
        return; // Exit if no video container is identified
    }

    // Locate an <a> tag within the container that links to the video
    const linkElement = videoContainer.querySelector("a#thumbnail");
    if (!linkElement || !linkElement.href) {
        console.debug("No video link found", videoContainer);
        return;
    }

    const titleElement = videoContainer.querySelector("#video-title");
    if (!titleElement || !titleElement.textContent) {
        console.debug("No video title found", videoContainer);
        return; // Exit if no video title is identified
    }

    const thumbnailElement = videoContainer.querySelector("#thumbnail img");
    if (!thumbnailElement) {
        console.debug("No thumbnail found", videoContainer);
        return;
    }

    // Extract the video ID from the URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)
    const url = new URL(linkElement.href);
    const id = url.searchParams.get("v");
    const title = titleElement.textContent.trim();
    const thumbnail = thumbnailElement.getAttribute("src");

    return {
        id: id,
        title: title,
        thumbnail: thumbnail,
    };
}

/**
 * Extracts the video ID from the main YouTube video options menu.
 * @param {Element} target - The clicked element.
 * @returns {VideoInfo} The YouTube video Info.
 */
function getVideoInfoFromMainVideoOptionMenu(target) {
    if (
        target.tagName != "DIV" ||
        !target.classList.contains("yt-spec-touch-feedback-shape__fill") ||
        !target.closest("#actions-inner")
    ) {
        return;
    }

    return getVideoInfoFromVideoDetail();
}

/**
 * Extracts the video info from the YouTube video detail page.
 * @returns {VideoInfo} The YouTube video Info.
 */
export function getVideoInfoFromVideoDetail() {
    const titleElement = document.querySelector("#title > h1");
    if (!titleElement || !titleElement.textContent) {
        console.error("No title element found", document);
        return;
    }

    const id = getSearchParam(window.location.href).v;
    const title = titleElement.textContent.trim();
    const thumbnail =
        document
            .querySelector("head > link[as=image][rel=preload]")
            ?.getAttribute("href") ||
        `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

    return {
        id,
        title,
        thumbnail,
    };
}

/**
 * Detects when a video option is clicked.
 */
export function detectVideoOptionClick(target) {
    const videoInfo =
        getVideoInfoFromItemVideoOptionMenu(target) ||
        getVideoInfoFromMainVideoOptionMenu(target);

    // for example, when the more options of comments is clicked
    if (!videoInfo) {
        const containerElement = document.querySelector(
            `${dropdownSelector} #${extraOptionsContainerId}`
        );
        if (containerElement) {
            containerElement.setAttribute("aria-hidden", true);
        }
        return;
    }

    console.debug("Detecting video option click:", target, videoInfo);

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoInfo.id)) {
        console.warn("Invalid video ID.", videoInfo.id, target);
        return;
    }

    // TODO set timeout
    waitForElm(`${dropdownSelector}:not([aria-hidden='true'])`).then(
        (dropdown) => {
            updateExtraOptions(dropdown, videoInfo);
        }
    );
}
