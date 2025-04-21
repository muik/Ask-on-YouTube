import { Errors } from "../../errors.ts";
import { findSimpleQuestionInputShown } from "./components/SimpleQuestionForm.tsx";
import { findQuestionMenuShown } from "./moreOptions.ts";
import { isQuestionDialogOpened, showQuestionDialog } from "./questionView.ts";
import { showToastMessage } from "./toast.js";
import { getVideoInfoFromShortsDetail } from "./videoInfo.ts";

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
export const handleQuestionShortcut = event => {
    // Check if 'q' key is pressed and no modifier keys are held
    if (event.code !== "KeyQ") return;
    if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;

    // Skip if the key is pressed in an input field
    if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") return;

    // Skip if the key is pressed in a comment input
    if (event.target.className.includes("yt-formatted-string")) {
        return;
    }

    // Skip if the question dialog is already opened
    if (isQuestionDialogOpened()) {
        return;
    }

    event.preventDefault();

    const questionButton = findQuestionMenuShown();
    if (questionButton) {
        questionButton.click();
        return;
    }

    if (isVideoDetailPage()) {
        const input = findSimpleQuestionInputShown();
        if (input) {
            input.focus();
            return;
        }
    } else if (window.location.pathname.startsWith("/shorts/")) {
        // on shorts page without question menu
        const videoContainer = document.querySelector(
            "ytd-reel-video-renderer[is-active] ytd-reel-player-overlay-renderer"
        );
        if (videoContainer) {
            const { videoInfo } = getVideoInfoFromShortsDetail(videoContainer);
            if (videoInfo) {
                try {
                    showQuestionDialog(videoInfo);
                } catch (error) {
                    if (error.code in Errors) {
                        showToastMessage(error.message);
                    } else {
                        console.error("handleQuestionShortcut error:", error);
                        showToastMessage(Errors.UNKNOWN_ERROR.message);
                    }
                }
            }
        }
    }
};
