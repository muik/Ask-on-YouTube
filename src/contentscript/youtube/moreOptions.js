import { getPromptGemini } from "../../storage.js";
import { config } from "../config.js";
import { getSearchParam } from "../searchParam";
import { waitForElm } from "../utils.js";

/**
 * Inserts the "View in Gemini" button into the YouTube video options menu.
 * @param {Element} element - The YouTube video options menu.
 */
function insertViewInGeminiButton(element) {
    if (element.querySelector("#view_in_gemini")) {
        console.debug("Element already added the option.");
        return;
    }

    // Adjust the popup dialog height after adding an item
    const popupElement = element.querySelector("ytd-menu-popup-renderer");
    const currentMaxHeight = parseInt(
        window.getComputedStyle(popupElement).maxHeight || "0",
        10
    );

    if (currentMaxHeight === 0) {
        console.debug("popup dialog is not visible.");
        return;
    }

    const lastItem = element.querySelector(
        "ytd-menu-service-item-renderer:last-child"
    );

    // Verify if the last item exists
    if (!lastItem) {
        console.debug("Last menu item is not visible.", lastItem);
        return;
    }

    // Add a separator below the last item
    lastItem.setAttribute("has-separator", "");

    const geminiOptionHTML = `
                <div id="view_in_gemini" class="style-scope ytd-menu-popup-renderer" role="menuitem" tabindex="-1" aria-selected="false" style="cursor:pointer">
                    <tp-yt-paper-item class="style-scope ytd-menu-service-item-renderer" role="option" tabindex="0" aria-disabled="false">    
                        <div style="font-size:14px">View in Gemini</div>
                    </tp-yt-paper-item>
                </div>`;

    lastItem
        .closest("tp-yt-paper-listbox")
        .insertAdjacentHTML("beforeend", geminiOptionHTML);

    // Click event listener for the "View in Gemini" button
    element.querySelector("#view_in_gemini").addEventListener("click", (e) => {
        e.stopPropagation();

        window.open(
            `https://gemini.google.com/app?ref=${config["refCode"]}`,
            "_blank"
        );

        // Close the dropdown menu
        element.style.display = "none";
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
 * Extracts the video ID from the YouTube video options menu.
 * @param {Element} target - The clicked element.
 * @returns {string} The YouTube video ID.
 */
function getVideoIdFromItemVideoOptionMenu(target) {
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
    const videoLink = videoContainer.querySelector("a#thumbnail");
    if (!videoLink || !videoLink.href) {
        console.debug("No video link found", videoContainer);
        return;
    }

    // Extract the video ID from the URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)
    const url = new URL(videoLink.href);
    let videoId = url.searchParams.get("v");

    return videoId;
}

/**
 * Extracts the video ID from the main YouTube video options menu.
 * @param {Element} target - The clicked element.
 * @returns {string} The YouTube video ID.
 */
function getVideoIdFromMainVideoOptionMenu(target) {
    if (
        target.tagName != "DIV" ||
        !target.classList.contains("yt-spec-touch-feedback-shape__fill") ||
        !target.closest("#actions-inner")
    ) {
        return;
    }

    return getSearchParam(window.location.href).v;
}

/**
 * Detects when a video option is clicked.
 */
export function detectVideoOptionClick(target) {
    const videoId =
        getVideoIdFromItemVideoOptionMenu(target) ||
        getVideoIdFromMainVideoOptionMenu(target);

    if (!videoId) {
        return;
    }

    console.debug("Detecting video option click:", target);

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        console.warn("Invalid video ID.", videoId, target);
        return;
    }

    // TODO set loading state
    setGeminiPrompt(videoId).then(() => {
        // TODO set timeout
        waitForElm("tp-yt-iron-dropdown[aria-disabled='false']:not([aria-hidden='true'])").then((dropdown) => {
            insertViewInGeminiButton(dropdown);
        });
    });
}

/**
 * Saves the prompt to use when inserting prompts into Gemini.
 * @param {string} videoId - The YouTube video ID.
 */
async function setGeminiPrompt(videoId) {
    if (!chrome.runtime || !chrome.runtime.sendMessage) {
        console.warn("chrome.runtime is unavailable or unsupported.");
        // Provide fallback behavior if necessary
        alert("Unable to send the prompt to Gemini. Please try again later.");
        return;
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const userText = await getPromptGemini();
    const prompt = `${userText}\n${videoUrl}`;

    chrome.runtime.sendMessage(
        {
            message: "setPrompt",
            prompt: prompt,
        },
        (response) => {
            if (chrome.runtime.lastError) {
                console.error(
                    "Error sending message:",
                    chrome.runtime.lastError.message
                );
            } else {
                console.debug("Message sent successfully:", response);
            }
        }
    );
}
