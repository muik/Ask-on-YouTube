import { config } from "../config.js";
import { getSearchParam } from "../searchParam.js";
import { waitForElm } from "../utils.js";
import { getSpinnerHtml } from "./htmlSnippets.js";

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
    let url;

    if (target === "chatgpt") {
        url = "https://chatgpt.com/";
    } else if (target === "gemini") {
        url = "https://gemini.google.com/app";
    } else {
        console.error("Invalid option clicked.", e.target);
        return;
    }

    const containerElement = e.target.closest(`#${extraOptionsContainerId}`);
    const videoInfo = {
        id: containerElement.getAttribute("video-id"),
        title: containerElement.getAttribute("video-title"),
    };

    if (!chrome.runtime) {
        showReloadRequiredView();
        return;
    }

    // set loading state
    const preHtml = element.innerHTML;
    element.innerHTML = getSpinnerHtml();
    element.setAttribute("disabled", true);

    chrome.runtime.sendMessage(
        { message: "setPrompt", target: target, videoInfo },
        (response) => {
            element.innerHTML = preHtml;
            element.removeAttribute("disabled");

            if (response.error) {
                console.error("Error setting prompt.", response.error);
                return;
            }

            window.open(`${url}?ref=${config["refCode"]}`, "_blank");

            // Close the dropdown menu
            pressEscKey();
        }
    );
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
 * Show a toast notification indicating that the browser needs to be reloaded.
 */
function showReloadRequiredView() {
    let containerElement = document.querySelector("#toast-container");
    let toastElement;
    if (!containerElement) {
        document.querySelector("ytd-popup-container").insertAdjacentHTML(
            "beforeend",
            `<yt-notification-action-renderer id="toast-container">
                <div id="toast-box" style="outline: none; left: 0px; top: 955px;"></div>
            </yt-notification-action-renderer>`
        );

        containerElement = document.querySelector("#toast-container");
        toastElement = containerElement.querySelector("#toast-box");
        toastElement.addEventListener("transitionend", (event) => {
            if (
                event.propertyName === "transform" &&
                !toastElement.classList.contains("open")
            ) {
                toastElement.style.display = "none"; // Hide the element
            }
        });
    } else {
        toastElement = containerElement.querySelector("#toast-box");
    }

    toastElement.textContent =
        "The Chrome extension has been updated. Please reload this page to use it.";

    toastElement.style.display = "";
    toastElement.style.zIndex = "2206";
    toastElement.style.top = `${window.innerHeight - 80}px`;

    // Trigger a reflow to apply transition
    void toastElement.offsetHeight;

    if (!toastElement.classList.contains("open")) {
        toastElement.classList.add("open");
    }

    setTimeout(() => {
        toastElement.classList.remove("open");
    }, 3000);
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

    // Extract the video ID from the URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)
    const url = new URL(linkElement.href);
    const id = url.searchParams.get("v");
    const title = titleElement.textContent.trim();

    return {
        id: id,
        title: title,
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

    return {
        id: getSearchParam(window.location.href).v,
        title: titleElement.textContent.trim(),
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
