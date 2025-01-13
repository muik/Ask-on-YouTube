import { config } from "../config.js";
import { watchElement } from "../utils.js";

/**
 * Helper function to check if an element is visible.
 * @param {HTMLElement} element - The element to check.
 * @returns {boolean} - Returns true if the element is visible, otherwise false.
 */
function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.height > 0;
}

/**
 * Inserts the "View in Gemini" option into the more options dropdown menu.
 */
export function insertMoreOptions() {
    watchElement({
        selector:
            'tp-yt-iron-dropdown[aria-disabled="false"]:not([aria-hidden="true"])',
        callback: (element) => {
            const id = "yt_ai_more_options";

            // Skip if the element already has the ID attribute set
            if (element.getAttribute(id) !== null) {
                return;
            }

            const lastItem = element.querySelector(
                "ytd-menu-service-item-renderer:last-child"
            );

            // Verify if the last item is visible
            if (!lastItem || !isElementVisible(lastItem)) {
                console.debug("Last menu item is not visible.");
                return;
            }

            element.setAttribute(id, true);

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

            element
                .querySelector("#view_in_gemini")
                .addEventListener("click", () => {
                    setTimeout(() => {
                        window.open(
                            `https://gemini.google.com/app?ref=${config['refCode']}`,
                            "_blank"
                        );
                    }, 500);

                    // Close the dropdown menu
                    element.style.display = "none";
                });

            // Adjust the popup dialog height after adding an item
            const popupElement = element.querySelector(
                "ytd-menu-popup-renderer"
            );
            const currentMaxHeight = parseInt(
                window.getComputedStyle(popupElement).maxHeight || "0",
                10
            );
            if (!isNaN(currentMaxHeight) && currentMaxHeight > 0) {
                const newMaxHeight = currentMaxHeight + 150;
                popupElement.style.maxHeight = `${newMaxHeight}px`;
            } else {
                console.warn("max-height is not set or is not a valid number.");
            }
        },
    });
}

/**
 * Detects when a video option is clicked.
 */
export function detectVideoOptionClick(target) {
    if (
        target.tagName != "DIV" ||
        !target.parentElement ||
        !target.parentElement.classList.contains("yt-icon")
    ) {
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
        console.log("No video container found", menuButton);
        return; // Exit if no video container is identified
    }

    // Locate an <a> tag within the container that links to the video
    const videoLink = videoContainer.querySelector("a#thumbnail");
    if (!videoLink || !videoLink.href) {
        console.log("No video link found", videoContainer);
        return;
    }

    // Extract the video ID from the URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)
    const url = new URL(videoLink.href);
    let videoId = url.searchParams.get("v");

    if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        setGeminiPrompt(videoId);
    } else {
        console.warn("Invalid or missing video ID.", videoId);
    }
}

/**
 * Saves the prompt to insert into Gemini.
 * @param {string} videoId - The YouTube video ID.
 */
function setGeminiPrompt(videoId) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(
            {
                message: "setPrompt",
                prompt: videoUrl,
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
    } else {
        console.warn("chrome.runtime is unavailable or unsupported.");
        // Provide fallback behavior if necessary
        alert("Unable to send the prompt to Gemini. Please try again later.");
    }
}
