import { getVideoIdFromUrl } from "../utils";
import { ClickElementType, ClickResult } from "../videoInfo";

/**
 * Identify the video info from the YouTube video options menu.
 * @param target - The clicked element.
 * @returns The click result. If undefined, this is not the correct type of element and other options need to be considered.
 */
export function getVideoInfoFromItemVideoOptionMenu(target: HTMLElement): ClickResult | undefined {
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
    const menuButton = target.closest("ytd-menu-renderer") as HTMLElement | null;
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
    const videoContainer = menuButton.closest(rendererClassName) as HTMLElement | null;
    if (!videoContainer) {
        console.debug("No video container found", menuButton);
        return {
            type: ClickElementType.OTHER,
        }; // Exit if no video container is identified
    }

    if (rendererClassName === "ytd-notification-renderer") {
        return getVideoInfoFromNotification(videoContainer as HTMLElement);
    }

    // Locate an <a> tag within the container that links to the video
    const linkElement = videoContainer.querySelector<HTMLAnchorElement>("a#thumbnail");
    if (!linkElement || !linkElement.href) {
        return {
            type: ClickElementType.OTHER,
        };
    }

    const thumbnailElement = videoContainer.querySelector<HTMLImageElement>("img.yt-core-image");
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
    const id = getVideoIdFromUrl(linkElement.href);
    if (!id) {
        console.debug("No video ID found in URL on item video option menu", linkElement.href);
        return {
            type: ClickElementType.OTHER,
        };
    }
    const title = titleElement.textContent.trim();
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
 * Extracts the video info from the notification.
 * @param videoContainer - The video container.
 * @returns The click result. If undefined, this is not the correct type of element and other options need to be considered.
 */
function getVideoInfoFromNotification(videoContainer: HTMLElement): ClickResult | undefined {
    const linkElement = videoContainer.querySelector<HTMLAnchorElement>(":scope > a");

    if (!linkElement) {
        console.debug("No link element found", videoContainer);
        return {
            type: ClickElementType.OTHER,
        };
    }

    if (!linkElement.href) {
        // not for video detail page, example: comment reply
        return {
            type: ClickElementType.NO_EXTRA_OPTIONS,
        };
    }

    const titleElement = linkElement.querySelector(
        ":scope > div.text > yt-formatted-string > span:last-child"
    );
    const thumbnailElement = linkElement.querySelector<HTMLImageElement>(
        ":scope > div.thumbnail-container img"
    );

    if (!titleElement || !titleElement.textContent) {
        console.debug("No video title found", videoContainer);
        return {
            type: ClickElementType.OTHER,
        };
    }
    if (!thumbnailElement || !thumbnailElement.src) {
        console.debug("No thumbnail element found", videoContainer);
        return {
            type: ClickElementType.OTHER,
        };
    }

    const id = getVideoIdFromUrl(linkElement.href);
    if (!id) {
        console.debug("No video ID found in URL on notification", linkElement.href);
        return {
            type: ClickElementType.OTHER,
        };
    }
    const title = titleElement.textContent.trim();
    const thumbnail = thumbnailElement.src;

    return {
        videoInfo: {
            id,
            title,
            thumbnail,
        },
    };
}
