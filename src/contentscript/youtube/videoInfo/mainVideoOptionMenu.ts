import {
    ClickElementType,
    ClickResult,
    getVideoInfoFromShortsDetail,
    getVideoInfoFromVideoDetail,
} from "../videoInfo";

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
        if (expectedMenuButton?.getAttribute("id")?.endsWith("-replies")) {
            // skip more-replies or less-replies button
            return {
                type: ClickElementType.OTHER,
            };
        }

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

    const linkElement = container.querySelector<HTMLAnchorElement>("h3 a");
    const thumbnailElement = container.querySelector<HTMLImageElement>("img.yt-core-image");

    return getVideoInfoFromShortsLinkElement(linkElement, thumbnailElement);
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
 * Extracts the video ID from the shorts URL.
 * get the last pathname without query params
 * @param link - The shorts URL. like https://www.youtube.com/shorts/VIDEO_ID
 * @returns The video ID.
 */
function getVideoIdFromShortsUrl(link: string): string {
    const url = new URL(link);
    return url.pathname.split("/")[2];
}
