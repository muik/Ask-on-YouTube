import { BackgroundActions } from "../../../constants.ts";
import { Errors } from "../../../errors.ts";
import { isQuestionDialogClosed } from "../questionView.ts";
import { getContainerElement } from "./container.ts";

export const CaptionStatus = {
    PENDING: "pending",
    LOADING: "loading",
    LOADED: "loaded",
    ERROR: "error",
    UNAVAILABLE: "unavailable",
};
const CAPTION_LOAD_CHANGED_EVENT = "captionLoadChanged";

export async function loadCaption(thumbnailElement, videoInfo) {
    const containerElement = getContainerElement();
    const captionElement = containerElement.querySelector(".video-info .caption");

    setCaptionStatus(captionElement, CaptionStatus.LOADING);

    const imageUrl = thumbnailElement.getAttribute("src");
    const imageData = getImageData(thumbnailElement);

    try {
        const response = await chrome.runtime.sendMessage({
            action: BackgroundActions.GET_CAPTION,
            imageUrl,
            imageData,
        });

        if (chrome.runtime.lastError) {
            throw chrome.runtime.lastError;
        }
        if (response.error) {
            throw response.error;
        }

        if (response.caption) {
            setCaption(response.caption, videoInfo);
        }
    } catch (error) {
        setCaptionStatus(captionElement, CaptionStatus.ERROR);

        if (error.code === Errors.GEMINI_API_KEY_NOT_SET.code) {
            console.debug("loadCaption failed, due to GEMINI_API_KEY_NOT_SET");
            return;
        }
        if (error.code === Errors.GEMINI_API_KEY_NOT_VALID.code) {
            // ignore
            console.debug("loadCaption failed, due to GEMINI_API_KEY_NOT_VALID");
            return;
        }

        if (error.code) {
            console.info("loadCaption failed, due to:", error);
        } else {
            console.error("loadCaption Error:", error);
        }
    }
}

function getImageData(imgElement) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const maxWidth = 336;
    if (imgElement.naturalWidth > maxWidth) {
        canvas.width = maxWidth;
        canvas.height = imgElement.naturalHeight * (maxWidth / imgElement.naturalWidth);
    } else {
        canvas.width = imgElement.naturalWidth;
        canvas.height = imgElement.naturalHeight;
    }

    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

    // Convert canvas to Base64
    const mimeType = "image/jpeg";
    const dataUrl = canvas.toDataURL(mimeType); // Convert to JPEG
    const data = dataUrl.substring(dataUrl.indexOf(",") + 1);
    canvas.remove();

    return {
        inlineData: {
            data,
            mimeType,
        },
    };
}

export function addCaptionLoadChangedListener(callback) {
    const containerElement = getContainerElement();
    const captionElement = containerElement.querySelector(".video-info .caption");
    captionElement.addEventListener(CAPTION_LOAD_CHANGED_EVENT, callback);
}

export function removeCaptionLoadChangedListener(callback) {
    const containerElement = getContainerElement();
    const captionElement = containerElement.querySelector(".video-info .caption");
    captionElement.removeEventListener(CAPTION_LOAD_CHANGED_EVENT, callback);
}

export function setCaption(caption, videoInfo) {
    if (isQuestionDialogClosed() || videoInfo.caption) {
        return;
    }

    videoInfo.caption = caption;
    const containerElement = getContainerElement();
    const thumbnailElement = containerElement.querySelector(".video-info img.thumbnail");
    const captionElement = containerElement.querySelector(".video-info .caption");

    thumbnailElement.setAttribute("title", caption);
    captionElement.textContent = caption;
    setCaptionStatus(captionElement, CaptionStatus.LOADED);
}

export function setCaptionStatus(captionElement, newStatus) {
    const currentStatus = captionElement.getAttribute("status");
    if (currentStatus === newStatus) {
        return;
    }

    captionElement.setAttribute("status", newStatus);
    captionElement.dispatchEvent(
        new CaptionLoadChangedEvent(CAPTION_LOAD_CHANGED_EVENT, newStatus)
    );
}

class CaptionLoadChangedEvent extends Event {
    constructor(type, status) {
        super(type);
        this.status = status;
        this.isResolved = isCaptionResolved(status);
    }
}

export function setCaptionUnavailable() {
    const containerElement = getContainerElement();
    const captionElement = containerElement.querySelector(".video-info .caption");
    setCaptionStatus(captionElement, CaptionStatus.UNAVAILABLE);
}

function getCaptionStatus() {
    const containerElement = getContainerElement();
    const captionElement = containerElement.querySelector(".video-info .caption");
    return captionElement.getAttribute("status");
}

export function loadCaptionError() {
    const containerElement = getContainerElement();
    const captionElement = containerElement.querySelector(".video-info .caption");
    setCaptionStatus(captionElement, CaptionStatus.ERROR);
}

export function isCaptionResolved(status = null) {
    if (!status) {
        status = getCaptionStatus();
    }
    if (!status || status === CaptionStatus.PENDING || status === CaptionStatus.LOADING) {
        return false;
    }
    return true;
}
