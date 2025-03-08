import { BackgroundActions } from "../../../constants.js";
import { Errors } from "../../../errors.js";
import { isGeminiServiceAvailable } from "../geminiService.js";
import { getContainerElement, getDialogData, isQuestionDialogClosed } from "../questionView.js";

const CAPTION_LOADED_EVENT = 'captionLoaded';
let loadCaptionPendingArg = null;

export function loadCaptionIfPending() {
    if (loadCaptionPendingArg) {
        loadCaption(loadCaptionPendingArg);
    }
}

export async function loadCaption(event) {
    if (!isGeminiServiceAvailable()) {
        loadCaptionPendingArg = event;
        return;
    }
    loadCaptionPendingArg = null;

    const thumbnailElement = event.target;
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
        console.debug("loadCaption caption:", response.caption);
    } catch (error) {
        if (error.code === Errors.GEMINI_API_KEY_NOT_SET.code) {
            console.debug("loadCaption failed, due to GEMINI_API_KEY_NOT_SET");
            return;
        }
        if (error.code === Errors.GEMINI_API_KEY_NOT_VALID.code) {
            // ignore
            console.debug("loadCaption failed, due to GEMINI_API_KEY_NOT_VALID");
            return;
        }

        console.error("loadCaption Error:", error);
    }
}

function getImageData(imgElement) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const maxWidth = 336;
    if (imgElement.naturalWidth > maxWidth) {
        canvas.width = maxWidth;
        canvas.height =
            imgElement.naturalHeight * (maxWidth / imgElement.naturalWidth);
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

export function addCaptionLoadListener(callback) {
    const containerElement = getContainerElement();
    const captionElement = containerElement.querySelector('.video-info .caption');
    captionElement.addEventListener(CAPTION_LOADED_EVENT, callback);
}

export function removeCaptionLoadListener(callback) {
    const containerElement = getContainerElement();
    const captionElement = containerElement.querySelector('.video-info .caption');
    captionElement.removeEventListener(CAPTION_LOADED_EVENT, callback);
}

export function setCaption(caption) {
    if (isQuestionDialogClosed() || getDialogData().videoInfo.caption) {
        return;
    }

    getDialogData().videoInfo.caption = caption;
    const containerElement = getContainerElement();
    const thumbnailElement = containerElement.querySelector(
        ".video-info img.thumbnail"
    );
    const captionElement = containerElement.querySelector(
        ".video-info .caption"
    );

    thumbnailElement.setAttribute("title", caption);
    captionElement.textContent = caption;
    captionElement.dispatchEvent(new Event(CAPTION_LOADED_EVENT));
}
