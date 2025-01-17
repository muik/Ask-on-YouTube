import { config } from "../config.js";
import { getSearchParam } from "../searchParam.js";
import { waitForElm } from "../utils.js";

const extraOptionsContainerId = "extra-options";

/**
 * Inserts the "View in Gemini" button into the YouTube video options menu.
 * @param {Element} dropDownElement - The YouTube video options menu.
 * @param {VideoInfo} videoInfo - The YouTube video Info.
 */
function insertExtraOptions(dropDownElement, videoInfo) {
    console.debug("Inserting extra options:", dropDownElement, videoInfo);
    const containerSelector = `#${extraOptionsContainerId}`;
    let containerElement = dropDownElement.querySelector(containerSelector);

    if (containerElement) {
        console.debug("Element already added the option.");
        containerElement.setAttribute("video-id", videoInfo.id);
        containerElement.setAttribute("video-title", videoInfo.title);
        return;
    }

    // Adjust the popup dialog height after adding an item
    const popupElement = dropDownElement.querySelector(
        "ytd-menu-popup-renderer"
    );
    const currentMaxHeight = parseInt(
        window.getComputedStyle(popupElement).maxHeight || "0",
        10
    );

    if (currentMaxHeight === 0) {
        console.debug("popup dialog is not visible.");
        return;
    }

    const lastItem = dropDownElement.querySelector(
        "ytd-menu-service-item-renderer:last-child"
    );

    // Verify if the last item exists
    if (!lastItem) {
        console.debug("Last menu item is not visible.", lastItem);
        return;
    }

    // Add a separator below the last item
    lastItem.setAttribute("has-separator", "");

    const optionItemClassName = "option-item";
    const geminiOptionHTML = `
                <div id="${extraOptionsContainerId}">
                    <div class="${optionItemClassName}" target-value="chatgpt" style="">ChatGPT</div>
                    <div class="${optionItemClassName}" target-value="gemini" style="font-size:14px;width:50%">Gemini</div>
                </div>`;

    lastItem
        .closest("tp-yt-paper-listbox")
        .insertAdjacentHTML("beforeend", geminiOptionHTML);

    containerElement = dropDownElement.querySelector(containerSelector);
    containerElement.setAttribute("video-id", videoInfo.id);
    containerElement.setAttribute("video-title", videoInfo.title);

    // Click event listener for the "View in Gemini" button
    containerElement
        .querySelectorAll(`.${optionItemClassName}`)
        .forEach((elm) => {
            elm.addEventListener("click", onExtraOptionClick);
        });

    if (!isNaN(currentMaxHeight) && currentMaxHeight > 0) {
        const newMaxHeight = currentMaxHeight + 150;
        popupElement.style.maxHeight = `${newMaxHeight}px`;
    } else {
        console.debug(
            "max-height is not set or is not a valid number.",
            currentMaxHeight,
            popupElement
        );
    }
}

/**
 * Event listener for the extra options.
 * @param {Event} e
 */
function onExtraOptionClick(e) {
    e.stopPropagation();

    const target = e.target.getAttribute("target-value");
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

    chrome.runtime.sendMessage(
        { message: "setPrompt", target: target, videoInfo },
        (response) => {
            if (response.error) {
                console.error("Error setting prompt.", response.error);
                return;
            }

            window.open(`${url}?ref=${config["refCode"]}`, "_blank");

            // Close the dropdown menu
            // TODO: Find a better way to close the dropdown menu
            const dropdown = e.target.closest("tp-yt-iron-dropdown");
            dropdown.style.display = "none";
        }
    );
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

    if (!videoInfo) {
        return;
    }

    console.debug("Detecting video option click:", target, videoInfo);

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoInfo.id)) {
        console.warn("Invalid video ID.", videoInfo.id, target);
        return;
    }

    // TODO set timeout
    waitForElm(
        "tp-yt-iron-dropdown[aria-disabled='false']:not([aria-hidden='true'])"
    ).then((dropdown) => {
        insertExtraOptions(dropdown, videoInfo);
    });
}
