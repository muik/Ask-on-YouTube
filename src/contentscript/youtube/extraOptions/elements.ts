import { BackgroundActions } from "../../../constants.js";
import { Errors } from "../../../errors.js";
import { VideoInfo } from "../../../types.js";
import { extraOptionsClassName } from "../moreOptions.js";
import { showQuestionDialog } from "../questionView";
import { getQuestionMarkSvg } from "../simpleQuestion.js";
import { showToastMessage } from "../toast.js";

const questionText = chrome.i18n.getMessage("questionButtonText");
const shortcutTooltip = chrome.i18n.getMessage("questionShortcutTooltip");
const useMarkElements: HTMLElement[] = [];
let questionMenuUsedBefore: boolean | undefined;

export function createExtraOptionsContainer(): HTMLElement {
    const optionItemClassName = "option-item";
    const container = document.createElement("div");
    container.classList.add("ytq");
    container.classList.add(extraOptionsClassName);
    container.innerHTML = `
            <div class="vertical-menu ${optionItemClassName}" target-value="question">
                <div class="icon">${getQuestionMarkSvg()}</div>
                <span class="text">${questionText}</span>
                <span class="shortcut" title="${shortcutTooltip}">q</span>
            </div>`.trim();

    // Click event listener for the "View in Gemini" button
    container.querySelectorAll(`.${optionItemClassName}`).forEach(elm => {
        elm.addEventListener("click", onExtraOptionClick);
    });

    return container;
}

/**
 * Event listener for the extra options.
 * @param {Event} e
 */
function onExtraOptionClick(e: Event): void {
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
        removeQuestionMenuUseMark();
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

async function removeQuestionMenuUseMark(): Promise<void> {
    if (useMarkElements.length === 0) {
        return;
    }

    useMarkElements.forEach(element => {
        element.remove();
    });
    useMarkElements.length = 0;
    questionMenuUsedBefore = true;

    try {
        const response = await chrome.runtime.sendMessage({
            action: BackgroundActions.SET_QUESTION_MENU_USED_BEFORE,
        });
        if (!response.success) {
            console.error("removeQuestionMenuUseMark failed:", response);
        }
    } catch (error) {
        console.error("removeQuestionMenuUseMark Error:", error);
    }
}

export async function insertQuestionMenuUseMark(container: HTMLElement): Promise<void> {
    if (questionMenuUsedBefore === undefined) {
        try {
            const response = await chrome.runtime.sendMessage({
                action: BackgroundActions.GET_QUESTION_MENU_USED_BEFORE,
            });
            questionMenuUsedBefore = response.usedBefore;
        } catch (error) {
            if (error instanceof Error && error.message === "Extension context invalidated.") {
                // ignore the error
                return;
            }
            throw error;
        }
    }

    if (questionMenuUsedBefore) {
        return;
    }

    const element = document.createElement("div");
    element.classList.add("use-mark");

    const verticalMenu = container.querySelector(".vertical-menu");
    if (verticalMenu) {
        verticalMenu.insertAdjacentElement("beforeend", element);
        useMarkElements.push(element);
    }
}
