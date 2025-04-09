import { Errors } from "../../errors.js";
import { VideoInfo } from "../../types";

export enum ClickElementType {
    OTHER = 1, // not dropdown click
    NO_EXTRA_OPTIONS = 2, // the dropdown from this click should not show extra options
    UNEXPECTED = 3, // unexpected click type, should not happen
}

export interface ClickResult {
    type?: ClickElementType;
    videoInfo?: VideoInfo;
}

/**
 * Attempts to get video information from a clicked element, trying different strategies.
 * @param target - The clicked element.
 * @returns The click result. If undefined, this is not the correct type of element.
 */
export function getVideoInfo(target: HTMLElement): ClickResult | undefined {
    return (
        getVideoInfoFromItemVideoOptionMenu(target) || getVideoInfoFromMainVideoOptionMenu(target)
    );
}

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
        console.debug("No video link found", videoContainer);
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
    const url = new URL(linkElement.href);
    const id = url.searchParams.get("v");
    if (!id) {
        console.debug("No video ID found in URL", linkElement.href);
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

    const url = new URL(linkElement.href);
    const id = url.searchParams.get("v");
    if (!id) {
        console.debug("No video ID found in URL", linkElement.href);
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

/**
 * Extracts the video ID from the main YouTube video options menu.
 * @param target - The clicked element.
 * @returns The click result. If undefined, this is not the correct type of element and other options need to be considered.
 */
export function getVideoInfoFromMainVideoOptionMenu(target: HTMLElement): ClickResult | undefined {
    if (!target.classList.contains("yt-spec-touch-feedback-shape__fill")) {
        // not this type of element, need to find other options
        return;
    }

    // for shorts item on home page
    if (
        target.parentElement?.parentElement?.parentElement?.parentElement?.classList.contains(
            "shortsLockupViewModelHostOutsideMetadataMenu"
        )
    ) {
        return getVideoInfoFromShortsItem(target);
    }

    const expectedMenuButton =
        target.parentElement?.parentElement?.parentElement?.parentElement?.parentElement;
    if (expectedMenuButton?.nodeName === "BUTTON-VIEW-MODEL") {
        const adButtonSelector = "ytwReelsPlayerOverlayLayoutViewModelHostMenuButton";
        if (expectedMenuButton.classList.contains(adButtonSelector)) {
            // skip ad on shorts page
            return {
                type: ClickElementType.OTHER,
            };
        }
    }

    let menuButton = expectedMenuButton;
    if (expectedMenuButton?.nodeName !== "YTD-MENU-RENDERER") {
        console.debug("expectedMenuButton", expectedMenuButton);
        menuButton = target.closest("ytd-menu-renderer") as HTMLElement | null;
    }

    if (!menuButton) {
        console.debug(
            "No menu button found",
            target,
            target.parentElement?.parentElement?.parentElement?.parentElement?.parentElement
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
            const videoContainer = target.closest(rendererClassName) as HTMLElement | null;
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
 * @param target - The clicked element.
 * @returns The click result. If undefined, this is not the correct type of element and other options need to be considered.
 */
function getVideoInfoFromShortsItem(target: HTMLElement): ClickResult | undefined {
    const selector = "ytm-shorts-lockup-view-model";
    const container = target.closest(selector);
    if (!container) {
        console.debug(`No container found for selector ${selector}`, target);
        return {
            type: ClickElementType.UNEXPECTED,
        };
    }
    console.debug("getVideoInfoFromShortsItem", container);

    const linkElement = container.querySelector<HTMLAnchorElement>("h3 a");
    const thumbnailElement = container.querySelector<HTMLImageElement>("img.yt-core-image");

    return getVideoInfoFromShortsLinkElement(linkElement, thumbnailElement);
}

/**
 * Extracts the video ID from the shorts detail page.
 * @param rendererElement - The renderer element.
 * @returns The click result. If undefined, this is not the correct type of element and other options need to be considered.
 */
export function getVideoInfoFromShortsDetail(videoContainer: HTMLElement): ClickResult | undefined {
    const id = window.location.pathname.split("/")[2];
    const title = videoContainer.querySelector("h2")?.textContent?.trim();

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
 * @param linkElement - The link element.
 * @returns The click result. If undefined, this is not the correct type of element and other options need to be considered.
 */
function getVideoInfoFromShortsLinkElement(
    linkElement: HTMLAnchorElement | null,
    thumbnailElement: HTMLImageElement | null = null
): ClickResult | undefined {
    if (!linkElement || !linkElement.href) {
        console.debug("No link element found", linkElement);
        return {
            type: ClickElementType.UNEXPECTED,
        };
    }

    const id = getVideoIdFromShortsUrl(linkElement.href);
    const title = linkElement.textContent?.trim();
    if (!title) {
        console.debug("No title found in link element", linkElement);
        return {
            type: ClickElementType.UNEXPECTED,
        };
    }
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
 * @returns The video info.
 */
export function getVideoInfoFromVideoDetail(): VideoInfo {
    const titleElement = document.querySelector("#title > h1");
    if (!titleElement || !titleElement.textContent) {
        console.error("No title element found on video detail page", document);
        throw Errors.UNKNOWN_ERROR;
    }

    // url like https://www.youtube.com/watch?v=VIDEO_ID
    // get the v param from the url
    const url = new URL(window.location.href);
    const id = url.searchParams.get("v");
    if (!id) {
        console.error("No video ID found in URL", window.location.href);
        throw Errors.UNKNOWN_ERROR;
    }
    const title = titleElement.textContent.trim();

    return {
        id,
        title,
    };
}

/**
 * Extracts the video ID from the shorts URL.
 * get the last pathname without query params
 * @param link - The shorts URL. like https://www.youtube.com/shorts/VIDEO_ID
 * @returns The video ID.
 */
function getVideoIdFromShortsUrl(link: string): string {
    const url = new URL(link);
    return url.pathname.split("/")[2];
}
