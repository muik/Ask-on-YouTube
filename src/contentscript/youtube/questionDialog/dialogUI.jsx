import { render } from "preact";
import { containerId, getContainerElement } from "./container.ts";
import { QuestionDialog } from "./html.tsx";

/**
 * Creates a background overlay element for the dialog
 * @param {Object} options - The options for background element setup
 * @param {Function} options.onClick - Callback for when the background is clicked
 * @returns {HTMLElement} The background element
 */
export function createBackgroundElement({ onClick }) {
    const element = document.createElement("tp-yt-iron-overlay-backdrop");
    element.setAttribute("opened", "");
    element.classList.add("opened");
    element.addEventListener("click", onClick);
    return element;
}

function createContainerElement() {
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
export function insertQuestionDialog(videoInfo) {
    const containerElement = getContainerElement() || createContainerElement();
    document.querySelector("ytd-popup-container").appendChild(containerElement);
    render(<QuestionDialog initialVideoInfo={videoInfo} />, containerElement);

    return containerElement;
}
