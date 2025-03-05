"use strict";

import Config from "../config.js";
import { BackgroundActions } from "../constants.js";
import { waitForElm } from "./utils.js";

window.onload = async () => {
    runOnGeminiPage();
};

/**
 * Checks if the current page is the Gemini page opened by this extension.
 * @returns {boolean} Returns true if the current page is the Gemini page.
 */
function isOnGeminiPage() {
    if (
        window.location.hostname === "gemini.google.com" &&
        window.location.search === `?ref=${Config.REF_CODE}`
    ) {
        return true;
    }
    return false;
}

/**
 * Runs the script on the Gemini page.
 */
function runOnGeminiPage() {
    if (!isOnGeminiPage()) {
        return;
    }

    insertPrompt();
}

/**
 * Inserts the prompt into the Gemini page.
 */
function insertPrompt() {
    waitForElm("rich-textarea div.ql-editor.textarea.new-input-ui").then(
        (element) => {
            chrome.runtime.sendMessage(
                { action: BackgroundActions.GET_PROMPT },
                (response) => {
                    element.innerText = response.prompt;

                    // submit the prompt
                    setTimeout(() => {
                        document.querySelector("button.send-button").click();
                    }, 100);
                }
            );
        }
    );
}
