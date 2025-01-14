"use strict";

import { getUseExperimentalGemini } from "../storage.js";
import { config } from "./config.js";
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
        window.location.search === `?ref=${config["refCode"]}`
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

    getUseExperimentalGemini().then((useExperimentalGemini) => {
        if (useExperimentalGemini) {
            selectExperimentalModel().then(insertPrompt);
        } else {
            insertPrompt();
        }
    });
}

/**
 * Selects the experimental model in the Gemini page.
 */
async function selectExperimentalModel() {
    const element = await waitForElm("bard-mode-switcher button");
    // Click the button to open the dropdown
    element.click();
    const modelButtons = document.querySelectorAll(
        ".mat-mdc-menu-content button.mat-mdc-menu-item"
    );
    if (modelButtons && modelButtons.length > 1) {
        modelButtons[1].click();
    }
}

/**
 * Inserts the prompt into the Gemini page.
 */
function insertPrompt() {
    waitForElm("rich-textarea div.ql-editor.textarea.new-input-ui").then(
        (element) => {
            chrome.runtime.sendMessage({ message: "getPrompt" }, (response) => {
                element.innerText = response.prompt;

                // submit the prompt
                setTimeout(() => {
                    document.querySelector("button.send-button").click();
                }, 100);
            });
        }
    );
}
