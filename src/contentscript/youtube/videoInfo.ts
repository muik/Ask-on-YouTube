import { Errors } from "../../errors";
import { VideoInfo } from "../../types";
import { getVideoInfoFromItemVideoOptionMenu } from "./videoInfo/itemVideoOptionMenu.js";
import { getVideoInfoFromMainVideoOptionMenu } from "./videoInfo/mainVideoOptionMenu.js";

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
