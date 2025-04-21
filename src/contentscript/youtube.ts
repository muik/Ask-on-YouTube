import { BackgroundActions } from "../constants.js";
import { handleQuestionShortcut } from "./youtube/keyboardShortcuts.js";
import { detectVideoOptionClick, injectExtraOptions } from "./youtube/moreOptions";
import { injectShortcutHelp } from "./youtube/shortcutHelp.js";
import {
    cleanup as cleanupShortsHandlers,
    setupShortsClickHandlers,
} from "./youtube/shortsOptions/setupShortsClick.js";
import { injectDetailRelatedElements } from "./youtube/videoDetail.jsx";

/**
 * Handle clicks on the settings link
 * @param {MouseEvent} event - The click event
 */
function handleSettingsClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.matches("a.settings")) {
        event.preventDefault();
        chrome.runtime.sendMessage({
            action: BackgroundActions.OPEN_SETTINGS_PAGE,
        });
    }
}

// Cleanup function to handle all cleanup tasks
function cleanupAll(): void {
    cleanupShortsHandlers();
    // Add other cleanup functions here as needed
}

window.onload = async (): Promise<void> => {
    if (window.location.hostname !== "www.youtube.com") {
        return;
    }

    injectDetailRelatedElements();
    injectExtraOptions();
    injectShortcutHelp();
    setupShortsClickHandlers();

    document.addEventListener("click", detectVideoOptionClick);
    document.addEventListener("click", handleSettingsClick);
    document.addEventListener("keydown", handleQuestionShortcut);
};

// Cleanup when navigating away or closing the page
window.addEventListener("unload", cleanupAll);

// Cleanup when extension is being disabled/uninstalled
chrome.runtime.onSuspend?.addListener(cleanupAll);
