import { findQuestionMenuShown } from "./moreOptions.js";
import { findSimpleQuestionInputShown } from "./simpleQuestion.js";

/**
 * Check if current page is a video detail page
 * @returns {boolean} True if current page is a video detail page
 */
export function isVideoDetailPage() {
    if (window.location.pathname !== "/watch") {
        return false;
    }
    const url = new URL(window.location.href);
    return !!url.searchParams.get("v");
}

/**
 * Handle 'q' key shortcut to open question dialog
 * Triggers question menu in dropdown if shown, otherwise focuses question input on video page
 * @param {KeyboardEvent} event The keyboard event
 */
export const handleQuestionShortcut = (event) => {
    // Check if 'q' key is pressed and no modifier keys are held
    if (event.code !== "KeyQ") return;
    if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey)
        return;

    // Skip if the key is pressed in an input field
    if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA")
        return;

    event.preventDefault();

    const questionButton = findQuestionMenuShown();
    if (questionButton) {
        questionButton.click();
        return;
    }

    if (!isVideoDetailPage()) return;

    const input = findSimpleQuestionInputShown();
    if (input) {
        input.focus();
    }
};
