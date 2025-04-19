import { render } from "preact";
import { clearCaptionPending } from "./caption.js";
import { getContainerElement } from "./container";
import { getDialogData } from "./dialogState";

export function hideQuestionDialog(): void {
    const containerElement = getContainerElement();
    if (!containerElement) {
        return;
    }
    
    containerElement.style.display = "none";

    const backgroundElement = document.querySelector("tp-yt-iron-overlay-backdrop");
    if (backgroundElement) {
        backgroundElement.remove();
    }

    const dialogData = getDialogData();
    delete dialogData.videoInfo;
    clearCaptionPending();

    render(null, containerElement);
} 