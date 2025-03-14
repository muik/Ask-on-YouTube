import { Errors } from "../../errors.js";

/**
 * @typedef {Object} VideoInfo
 * @property {string} id - The video ID
 * @property {string} title - The video title
 * @property {string} [thumbnail] - The video thumbnail URL (optional)
 */

/**
 * Attempts to get video information from a clicked element, trying different strategies.
 * @param {Element} target - The clicked element.
 * @returns {ClickResult | undefined} - The click result. If undefined, this is not the correct type of element.
 */
export function getVideoInfo(target) {
    return (
        getVideoInfoFromItemVideoOptionMenu(target) || getVideoInfoFromMainVideoOptionMenu(target)
    );
}

/**
 * Identify the video info from the YouTube video options menu.
 * @param {Element} target - The clicked element.
 * @returns {ClickResult | undefined} - The click result. If undefined, this is not the correct type of element and other options need to be considered.
 */
export function getVideoInfoFromItemVideoOptionMenu(target) {
    if (!target.parentElement || !target.parentElement.classList.contains("yt-icon")) {
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
    const rendererClassName = Array.from(menuButton.classList).find(className =>
        className.startsWith("ytd-")
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
export function getVideoInfoFromMainVideoOptionMenu(target) {
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
        console.debug(
            "No menu button found",
            target,
            target.parentElement.parentElement.parentElement.parentElement.parentElement
        );
        return {
            type: ClickElementType.OTHER,
        };
    }

    const rendererClassName = Array.from(menuButton.classList).find(className =>
        className.startsWith("ytd-")
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
    console.debug("getVideoInfoFromShortsItem", container);

    const linkElement = container.querySelector("h3 a");
    const thumbnailElement = container.querySelector("img.yt-core-image");

    return getVideoInfoFromShortsLinkElement(linkElement, thumbnailElement);
}

/**
 * Extracts the video ID from the shorts detail page.
 * @param {Element} rendererElement - The renderer element.
 * @returns {ClickResult | undefined} - The click result. If undefined, this is not the correct type of element and other options need to be considered.
 */
export function getVideoInfoFromShortsDetail(videoContainer) {
    const id = window.location.pathname.split("/")[2];
    const title = videoContainer.querySelector("h2").textContent.trim();

    if (!title || !id) {
        console.debug("Unexpected shorts detail page", id, title, videoContainer);
        return {
            type: ClickElementType.UNEXPECTED,
        };
    }

    return {
        videoInfo: {
            id,
            title,
            thumbnail: null, // no thumbnail for shorts detail page
        },
    };
}

/**
 * Extracts the video info from the link element.
 * @param {Element} linkElement - The link element.
 * @returns {ClickResult | undefined} - The click result. If undefined, this is not the correct type of element and other options need to be considered.
 */
function getVideoInfoFromShortsLinkElement(linkElement, thumbnailElement = null) {
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
 * Extracts the video ID from the shorts URL.
 * get the last pathname without query params
 * @param {string} link - The shorts URL. like https://www.youtube.com/shorts/VIDEO_ID
 * @returns {string} The video ID.
 */
function getVideoIdFromShortsUrl(link) {
    const url = new URL(link);
    return url.pathname.split("/")[2];
}

export const ClickElementType = {
    OTHER: 1, // not dropdown click
    NO_EXTRA_OPTIONS: 2, // the dropdown from this click should not show extra options
    UNEXPECTED: 3, // unexpected click type, should not happen
};

/**
 * @typedef {Object} ClickResult
 * @property {ClickElementType} [type] - The type of click event
 * @property {VideoInfo} [videoInfo] - The video information if available
 */
