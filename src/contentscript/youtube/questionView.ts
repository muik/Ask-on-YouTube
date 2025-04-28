import { Errors } from "../../errors";
import { VideoInfo } from "../../types";
import { getContainerElement } from "./questionDialog/container";
import { hideQuestionDialog } from "./questionDialog/dialogManager";
import { getDialogData } from "./questionDialog/dialogState";
import { createBackgroundElement, insertQuestionDialog } from "./questionDialog/dialogUI";

export function getYouTubeLanguageCode(): string {
    const lang = document.querySelector("html")?.getAttribute("lang");
    return lang?.split("-")[0] || "en";
}

export function showQuestionDialog(videoInfo: VideoInfo): void {
    try {
        const dialogData = getDialogData();
        dialogData.videoInfo = videoInfo;
        const containerElement = insertQuestionDialog(videoInfo);
        containerElement.style.display = "block";
        containerElement.setAttribute("video-id", videoInfo.id);

        const backgroundElement = createBackgroundElement({ onClick: hideQuestionDialog });
        document.body.insertAdjacentElement("beforeend", backgroundElement);
    } catch (error: any) {
        if (error.message === "Extension context invalidated.") {
            throw Errors.EXTENSION_CONTEXT_INVALIDATED;
        }
        throw error;
    }
}

export function isQuestionDialogClosed(): boolean {
    const containerElement = getContainerElement();
    return containerElement ? containerElement.style.display === "none" : false;
}

export function isQuestionDialogOpened(): boolean {
    const containerElement = getContainerElement();
    return containerElement ? containerElement.style.display === "block" : false;
}
