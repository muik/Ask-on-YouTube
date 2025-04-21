import { render } from "preact";
import { VideoInfo } from "../../../types";
import { containerId, getContainerElement } from "./container";
import { QuestionDialog } from "./QuestionDialog";

interface BackgroundElementOptions {
    onClick: (event: MouseEvent) => void;
}

/**
 * Creates a background overlay element for the dialog
 * @param {BackgroundElementOptions} options - The options for background element setup
 * @returns {HTMLElement} The background element
 */
export function createBackgroundElement({ onClick }: BackgroundElementOptions): HTMLElement {
    const element = document.createElement("tp-yt-iron-overlay-backdrop");
    element.setAttribute("opened", "");
    element.classList.add("opened");
    element.addEventListener("click", onClick);
    return element;
}

function createContainerElement(): HTMLElement {
    const containerElement = document.createElement("div");
    containerElement.id = containerId;
    containerElement.role = "dialog";
    containerElement.classList.add("style-scope", "ytd-popup-container", "ytq", "ytq-dialog");
    containerElement.style.position = "fixed";
    return containerElement;
}

/**
 * Inserts the question dialog into the page
 * @param {VideoInfo} videoInfo - The video information
 * @returns {HTMLElement} The container element
 */
export function insertQuestionDialog(videoInfo: VideoInfo): HTMLElement {
    const containerElement = getContainerElement() || createContainerElement();
    document.querySelector("ytd-popup-container")?.appendChild(containerElement);
    render(<QuestionDialog initialVideoInfo={videoInfo} />, containerElement);

    return containerElement;
}
