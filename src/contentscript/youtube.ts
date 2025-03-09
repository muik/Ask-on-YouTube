import Honeybadger from "@honeybadger-io/js";
import { honeybadgerConfig } from "../config.js";
import { BackgroundActions } from "../constants.js";
import { handleQuestionShortcut } from "./youtube/keyboardShortcuts.js";
import {
    detectVideoOptionClick,
    insertExtraOptions,
} from "./youtube/moreOptions.js";
import { injectShortcutHelp } from "./youtube/shortcutHelp.js";
import { setupShortsClickHandlers } from "./youtube/shortsHandlers.js";
import { URLChangeDetector } from "./youtube/urlChangeDetector.js";
import { injectElements } from "./youtube/videoDetail.js";

Honeybadger.configure(honeybadgerConfig);

/**
 * Handle URL changes in the YouTube app
 * @param {Location} location - The current location object
 */
function handleUrlChange(location: Location): void {
    // Setup shorts handlers if on home page
    if (location.pathname === "/") {
        setupShortsClickHandlers();
    }
}

// Initialize URL change detector
const urlDetector = new URLChangeDetector(handleUrlChange);

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

window.onload = async (): Promise<void> => {
    if (window.location.hostname !== "www.youtube.com") {
        return;
    }

    injectElements();
    insertExtraOptions();
    injectShortcutHelp();

    // Initialize URL change detection
    urlDetector.init();

    // Initial setup
    handleUrlChange(location);

    document.addEventListener("click", detectVideoOptionClick);
    document.addEventListener("click", handleSettingsClick);
    document.addEventListener("keydown", handleQuestionShortcut);
}; 