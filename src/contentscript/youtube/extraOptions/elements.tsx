import { render } from "preact";
import { Errors } from "../../../errors.js";
import { VideoInfo } from "../../../types.js";
import { extraOptionsClassName } from "../moreOptions.js";
import { showQuestionDialog } from "../questionView";
import { showToastMessage } from "../toast.js";
import { QuestionOptionMenu } from "./QuestionOptionMenu";

export function createExtraOptionsContainer(): HTMLElement {
    const container = document.createElement("div");
    container.classList.add("ytq");
    container.classList.add(extraOptionsClassName);

    render(<QuestionOptionMenu />, container);

    return container;
}

export function onExtraOptionClick(e: React.MouseEvent<HTMLElement>): void {
    e.stopPropagation();
    const element = e.target as HTMLElement;

    const target =
        element.getAttribute("target-value") ||
        element.closest("[target-value]")?.getAttribute("target-value");

    const targets = ["chatgpt", "gemini", "question"];
    if (!target || !targets.includes(target)) {
        console.error("Invalid option clicked.", e.target);
        return;
    }

    const container = element.closest(`.${extraOptionsClassName}`);
    if (!container) {
        console.error("No container found", element);
        return;
    }

    const videoInfoJson = (container as HTMLElement).dataset.videoInfoJson;
    if (!videoInfoJson) {
        console.error("No video info found", container);
        showToastMessage(Errors.UNKNOWN_ERROR.message);
        return;
    }

    const videoInfo: VideoInfo = JSON.parse(videoInfoJson);

    if (!chrome.runtime || !chrome.runtime.sendMessage) {
        showToastMessage(Errors.EXTENSION_CONTEXT_INVALIDATED.message);
        return;
    }

    if (target === "question") {
        onQuestionClick(videoInfo);
        return;
    }

    console.error("Invalid option clicked.", e.target);
}

function onQuestionClick(videoInfo: VideoInfo): void {
    // Close the dropdown menu
    pressEscKey();

    try {
        showQuestionDialog(videoInfo);
    } catch (error: any) {
        if (error.code in Errors) {
            showToastMessage(error.message);
            return;
        }
        console.error("onQuestionClick error:", error);
        showToastMessage(Errors.UNKNOWN_ERROR.message);
    }
}

/**
 * Dispatch the ESC key press event on the document
 */
function pressEscKey(): void {
    // Create a new keyboard event
    const escEvent = new KeyboardEvent("keydown", {
        key: "Escape", // Key value
        code: "Escape", // Code for the Escape key
        keyCode: 27, // Deprecated, but some old browsers still use this
        which: 27, // Deprecated, but included for compatibility
        bubbles: true, // Allow the event to bubble up through the DOM
        cancelable: true, // The event can be canceled
    });

    // Dispatch the event on the document or a specific element
    document.dispatchEvent(escEvent);
}
