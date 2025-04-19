import { BackgroundActions } from "../../../constants.ts";
import { Errors } from "../../../errors.ts";
import { isGeminiServiceNotLoaded, isGeminiServiceUnavailable } from "../geminiService.js";
import { isQuestionDialogClosed } from "../questionView.ts";
import { getContainerElement } from "./container.ts";
import { getDialogData } from "./dialogState.ts";

const CaptionStatus = {
    PENDING: "pending",
    LOADING: "loading",
    LOADED: "loaded",
    ERROR: "error",
    UNAVAILABLE: "unavailable",
};
const CAPTION_LOAD_CHANGED_EVENT = "captionLoadChanged";

let loadCaptionPendingArg = null;

export function loadCaptionIfPending() {
    if (loadCaptionPendingArg) {
        loadCaption(loadCaptionPendingArg);
    }
}

export function clearCaptionPending() {
    loadCaptionPendingArg = null;
}

export async function loadCaption(event) {
    const containerElement = getContainerElement();
    const captionElement = containerElement.querySelector(".video-info .caption");

    if (isGeminiServiceNotLoaded()) {
        setCaptionStatus(captionElement, CaptionStatus.PENDING);
        loadCaptionPendingArg = event;
        return;
    } else if (isGeminiServiceUnavailable()) {
        setCaptionUnavailable();
        return;
    }
    loadCaptionPendingArg = null;

    setCaptionStatus(captionElement, CaptionStatus.LOADING);

    // When the event is triggered from a pending state, event.target will be null
    const thumbnailElement =
        event.target || containerElement.querySelector(".video-info img.thumbnail");

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
            setCaption(response.caption);
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

export function setCaption(caption) {
    if (isQuestionDialogClosed() || getDialogData().videoInfo.caption) {
        return;
    }

    getDialogData().videoInfo.caption = caption;
    const containerElement = getContainerElement();
    const thumbnailElement = containerElement.querySelector(".video-info img.thumbnail");
    const captionElement = containerElement.querySelector(".video-info .caption");

    thumbnailElement.setAttribute("title", caption);
    captionElement.textContent = caption;
    setCaptionStatus(captionElement, CaptionStatus.LOADED);
}

function setCaptionStatus(captionElement, newStatus) {
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
